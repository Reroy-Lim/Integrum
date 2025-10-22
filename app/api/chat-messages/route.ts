import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getJiraCommentsClient } from "@/lib/jira-comments"
import { getJiraTicket, JiraApiClient, type JiraConfig } from "@/lib/jira-api"

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

      // Determine target category based on who sent the message
      let targetCategory: string | null = null

      if (currentCategory === "Pending Reply") {
        // ANY account responding to a pending ticket → Move to "In Progress"
        targetCategory = "In Progress"
        console.log("[v0] Message sent on Pending Reply ticket → Moving to In Progress")
      } else if (!isMasterAccount && (!currentCategory || currentCategory === "In Progress")) {
        // User sending message on In Progress or new ticket → Move to "Pending Reply"
        targetCategory = "Pending Reply"
        console.log("[v0] User sending message on In Progress ticket → Moving to Pending Reply")
      }

      if (targetCategory) {
        console.log("[v0] Updating frontend category to:", targetCategory)

        const { data: upsertData, error: updateError } = await supabase
          .from("ticket_categories")
          .upsert(
            {
              ticket_key: ticketKey,
              category: targetCategory,
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
          console.log("[v0] ✅ Successfully updated frontend category to:", targetCategory)
          console.log("[v0] Upsert result:", upsertData)
        }
      } else {
        console.log("[v0] ⏭️  No category update needed for current state")
      }

      console.log("[v0] ===== FRONTEND CATEGORY UPDATE END =====")
    } catch (error) {
      // Don't fail the message send if category update fails
      console.error("[v0] ❌ Exception during frontend category update:", error)
      console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    }

    try {
      console.log("[v0] ===== JIRA STATUS TRANSITION CHECK START =====")
      console.log("[v0] Checking if ticket needs Jira status transition for:", ticketKey)

      const ticket = await getJiraTicket(ticketKey)

      if (ticket) {
        const currentStatus = ticket.status.name.toLowerCase()
        console.log("[v0] Current Jira status for", ticketKey, ":", currentStatus)

        const jiraConfig: JiraConfig = {
          baseUrl: process.env.JIRA_BASE_URL || "",
          email: process.env.JIRA_EMAIL || "",
          apiToken: process.env.JIRA_API_TOKEN || "",
          projectKey: process.env.JIRA_PROJECT_KEY || "",
        }

        const jiraClient = new JiraApiClient(jiraConfig)
        let transitioned = false

        if (currentStatus.includes("pending")) {
          console.log("[v0] Message sent on Pending ticket → Transitioning to In Progress")
          transitioned = await jiraClient.transitionTicket(ticketKey, "In Progress")

          if (transitioned) {
            console.log("[v0] ✅ Successfully transitioned ticket to In Progress")
          } else {
            console.log("[v0] ⚠️ Failed to transition ticket to In Progress (transition may not be available)")
          }
        }
        // Check if user is sending message on In Progress ticket
        else if (!isMasterAccount && (currentStatus.includes("progress") || currentStatus === "in development")) {
          console.log("[v0] User sending message on In Progress ticket → Transitioning to Pending Reply")
          transitioned = await jiraClient.transitionTicket(ticketKey, "Pending Reply")

          if (transitioned) {
            console.log("[v0] ✅ Successfully transitioned ticket to Pending Reply")
          } else {
            console.log("[v0] ⚠️ Failed to transition ticket to Pending Reply (transition may not be available)")
          }
        } else {
          console.log("[v0] Ticket status does not require transition:", currentStatus)
        }
      } else {
        console.log("[v0] Ticket not found in Jira")
      }

      console.log("[v0] ===== JIRA STATUS TRANSITION CHECK END =====")
    } catch (error) {
      // Don't fail the message send if transition fails
      console.error("[v0] ❌ Exception during Jira status transition:", error)
      console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    }

    return NextResponse.json({ message: dbResult.data })
  } catch (error) {
    console.error("[v0] Error in POST /api/chat-messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
