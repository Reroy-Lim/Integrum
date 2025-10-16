import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getJiraCommentsClient } from "@/lib/jira-comments"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const ticketKey = searchParams.get("ticketKey")

    if (!ticketKey) {
      return NextResponse.json({ error: "Ticket key is required" }, { status: 400 })
    }

    console.log("[v0] Fetching chat messages for ticket:", ticketKey)

    const supabase = await createClient()

    const [dbResult, jiraComments] = await Promise.all([
      supabase.from("chat_messages").select("*").eq("ticket_key", ticketKey).order("created_at", { ascending: true }),
      getJiraCommentsClient()
        .getComments(ticketKey)
        .catch((error) => {
          console.error("[v0] Error fetching Jira comments:", error)
          return []
        }),
    ])

    if (dbResult.error) {
      console.error("[v0] Error fetching messages:", dbResult.error)
      return NextResponse.json({ error: dbResult.error.message }, { status: 500 })
    }

    const dbMessages = dbResult.data || []

    const jiraClient = getJiraCommentsClient()
    const jiraMessages = jiraComments.map((comment) => {
      let messageText = jiraClient.extractTextFromADF(comment.body)
      let actualUserEmail = comment.author.emailAddress

      const emailPrefixMatch = messageText.match(/^([^\s]+@[^\s]+):\s*(.+)$/s)
      if (emailPrefixMatch) {
        actualUserEmail = emailPrefixMatch[1] // Use the email from the prefix
        messageText = emailPrefixMatch[2] // Remove the prefix from display
      }

      return {
        id: `jira-${comment.id}`,
        ticket_key: ticketKey,
        user_email: actualUserEmail, // Use actual sender email, not Jira service account
        author_name: actualUserEmail.split("@")[0], // Extract name from email
        message: messageText,
        role: actualUserEmail === process.env.JIRA_EMAIL ? "support" : "user",
        created_at: comment.created,
        source: "jira",
      }
    })

    const dbMessageMap = new Map(
      dbMessages.map((msg) => [`${msg.user_email}:${msg.message.trim().toLowerCase()}`, msg]),
    )

    // Filter out Jira messages that are duplicates of database messages
    const uniqueJiraMessages = jiraMessages.filter((jiraMsg) => {
      const key = `${jiraMsg.user_email}:${jiraMsg.message.trim().toLowerCase()}`
      return !dbMessageMap.has(key)
    })

    const enrichedDbMessages = dbMessages.map((msg) => ({
      ...msg,
      author_name: msg.user_email.split("@")[0], // Extract name from email
    }))

    const allMessages = [...enrichedDbMessages, ...uniqueJiraMessages].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    )

    console.log(
      "[v0] Fetched",
      dbMessages.length,
      "DB messages,",
      jiraMessages.length,
      "Jira comments,",
      uniqueJiraMessages.length,
      "unique Jira messages",
    )

    return NextResponse.json({ messages: allMessages })
  } catch (error) {
    console.error("[v0] Error in GET /api/chat-messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ticketKey, userEmail, message, role } = body

    if (!ticketKey || !userEmail || !message || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log("[v0] Saving chat message:", { ticketKey, userEmail, role, messageLength: message.length })

    const supabase = await createClient()

    const jiraCommentText = `${userEmail}: ${message}`

    const [dbResult, jiraResult] = await Promise.all([
      supabase
        .from("chat_messages")
        .insert({
          ticket_key: ticketKey,
          user_email: userEmail,
          message,
          role,
        })
        .select()
        .single(),
      getJiraCommentsClient()
        .addComment(ticketKey, jiraCommentText) // Include email prefix for identification
        .catch((error) => {
          console.error("[v0] Error posting to Jira:", error)
          return null
        }),
    ])

    if (dbResult.error) {
      console.error("[v0] Error saving message:", dbResult.error)
      return NextResponse.json({ error: dbResult.error.message }, { status: 500 })
    }

    console.log("[v0] Message saved to DB:", dbResult.data.id)
    if (jiraResult) {
      console.log("[v0] Message posted to Jira:", jiraResult.id)
    }

    return NextResponse.json({ message: dbResult.data })
  } catch (error) {
    console.error("[v0] Error in POST /api/chat-messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
