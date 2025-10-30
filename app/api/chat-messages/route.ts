import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getJiraCommentsClient } from "@/lib/jira-comments"
import { JiraApiClient, type JiraConfig } from "@/lib/jira-api"

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
    const formData = await request.formData()
    const ticketKey = formData.get("ticketKey") as string
    const userEmail = formData.get("userEmail") as string
    const message = formData.get("message") as string
    const role = formData.get("role") as string

    if (!ticketKey || !userEmail || !message || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log("[v0] ===== CHAT MESSAGE POST START =====")
    console.log("[v0] Saving chat message:", { ticketKey, userEmail, role, messageLength: message.length })

    const supabase = await createClient()

    const isMasterAccount = userEmail === process.env.JIRA_EMAIL
    const jiraCommentText = isMasterAccount ? message : `${userEmail}: ${message}`

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
        .addComment(ticketKey, jiraCommentText)
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

    const fileCount = Number.parseInt(formData.get("fileCount") as string) || 0
    if (fileCount > 0) {
      console.log("[v0] Processing", fileCount, "file upload(s)")
      // TODO: Implement file upload handling (e.g., upload to Vercel Blob or Supabase Storage)
    }

    try {
      console.log("[v0] ===== FRONTEND CATEGORY UPDATE START =====")
      console.log("[v0] Checking if ticket needs frontend category update for:", ticketKey)

      // Get current frontend category (if exists)
      const { data: existingCategory, error: fetchError } = await supabase
        .from("ticket_categories")
        .select("category")
        .eq("ticket_key", ticketKey)
        .single()

      if (fetchError && fetchError.code !== "PGRST116") {
        // PGRST116 is "not found" error, which is expected for new tickets
        console.error("[v0] Error fetching existing category:", fetchError)
      }

      const currentCategory = existingCategory?.category
      console.log("[v0] Current frontend category for", ticketKey, ":", currentCategory || "none")

      // Only update if ticket is currently "In Progress" or has no category set
      if (!currentCategory || currentCategory === "In Progress") {
        console.log("[v0] Ticket qualifies for category update. Updating to 'Pending Reply'...")

        const { data: upsertData, error: updateError } = await supabase
          .from("ticket_categories")
          .upsert(
            {
              ticket_key: ticketKey,
              category: "Pending Reply",
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: "ticket_key",
            },
          )
          .select()

        if (updateError) {
          console.error("[v0] ❌ Error updating frontend category:", updateError)
          console.error("[v0] Error details:", JSON.stringify(updateError, null, 2))
        } else {
          console.log("[v0] ✅ Successfully updated frontend category to 'Pending Reply'")
          console.log("[v0] Upsert result:", upsertData)

          try {
            console.log("[v0] ===== JIRA STATUS & RESOLUTION UPDATE START =====")
            const jiraConfig: JiraConfig = {
              baseUrl: process.env.JIRA_BASE_URL || "",
              email: process.env.JIRA_EMAIL || "",
              apiToken: process.env.JIRA_API_TOKEN || "",
              projectKey: process.env.JIRA_PROJECT_KEY || "",
            }

            const jiraClient = new JiraApiClient(jiraConfig)
            const result = await jiraClient.updateTicketStatusAndResolution(ticketKey, "Pending Reply")

            if (result.success) {
              console.log(
                `[v0] ✅ Successfully updated Jira - Status: ${result.status}, Resolution: ${result.resolution}`,
              )
            } else {
              console.log("[v0] ⚠️ Failed to update Jira status and resolution")
            }
            console.log("[v0] ===== JIRA STATUS & RESOLUTION UPDATE END =====")
          } catch (jiraError) {
            console.error("[v0] ❌ Exception during Jira status/resolution update:", jiraError)
          }
        }
      } else {
        console.log("[v0] ⏭️  Ticket category is already:", currentCategory, "- no update needed")
      }

      console.log("[v0] ===== FRONTEND CATEGORY UPDATE END =====")
    } catch (error) {
      // Don't fail the message send if category update fails
      console.error("[v0] ❌ Exception during frontend category update:", error)
      console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    }

    return NextResponse.json({ message: dbResult.data })
  } catch (error) {
    console.error("[v0] Error in POST /api/chat-messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
