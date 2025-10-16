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
    const jiraMessages = jiraComments.map((comment) => ({
      id: `jira-${comment.id}`,
      ticket_key: ticketKey,
      user_email: comment.author.emailAddress,
      message: jiraClient.extractTextFromADF(comment.body),
      role: comment.author.emailAddress === process.env.JIRA_EMAIL ? "support" : "user",
      created_at: comment.created,
      source: "jira",
    }))

    const allMessages = [...dbMessages, ...jiraMessages].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    )

    console.log("[v0] Fetched", dbMessages.length, "DB messages and", jiraMessages.length, "Jira comments")

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
        .addComment(ticketKey, `${userEmail}: ${message}`)
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
