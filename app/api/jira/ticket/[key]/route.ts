import { type NextRequest, NextResponse } from "next/server"
import { JiraApiClient } from "@/lib/jira-api"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { key: string } }) {
  const ticketKey = params.key

  try {
    const jiraConfig = {
      baseUrl: process.env.JIRA_BASE_URL || "",
      email: process.env.JIRA_EMAIL || "",
      apiToken: process.env.JIRA_API_TOKEN || "",
      projectKey: process.env.JIRA_PROJECT_KEY || "HELP",
    }

    const jiraClient = new JiraApiClient(jiraConfig)
    const ticket = await jiraClient.getTicket(ticketKey)

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error("Error fetching JIRA ticket:", error)
    return NextResponse.json({ error: "Failed to fetch ticket" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { key: string } }) {
  const ticketKey = params.key

  try {
    const body = await request.json()
    const { action } = body

    if (action !== "resolve") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    console.log("[v0] ===== RESOLVE TICKET START =====")
    console.log("[v0] Resolving ticket:", ticketKey)

    const jiraConfig = {
      baseUrl: process.env.JIRA_BASE_URL || "",
      email: process.env.JIRA_EMAIL || "",
      apiToken: process.env.JIRA_API_TOKEN || "",
      projectKey: process.env.JIRA_PROJECT_KEY || "HELP",
    }

    const jiraClient = new JiraApiClient(jiraConfig)

    console.log("[v0] Transitioning Jira ticket to Done...")
    const success = await jiraClient.transitionTicket(ticketKey, "Done")

    if (!success) {
      console.error("[v0] ❌ Failed to transition Jira ticket to Done")
      return NextResponse.json({ error: "Failed to resolve ticket" }, { status: 500 })
    }
    console.log("[v0] ✅ Jira ticket transitioned to Done")

    try {
      console.log("[v0] Updating frontend category to Resolved...")
      const supabase = await createClient()

      const { data: upsertData, error: updateError } = await supabase
        .from("ticket_categories")
        .upsert(
          {
            ticket_key: ticketKey,
            category: "Resolved",
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
        // Don't fail the request if category update fails
      } else {
        console.log("[v0] ✅ Successfully updated frontend category to Resolved")
        console.log("[v0] Upsert result:", upsertData)
      }
    } catch (error) {
      console.error("[v0] ❌ Exception during frontend category update:", error)
      console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")
      // Don't fail the request if category update fails
    }

    console.log("[v0] ===== RESOLVE TICKET END =====")

    return NextResponse.json({ success: true, message: "Ticket resolved successfully" })
  } catch (error) {
    console.error("[v0] Error resolving JIRA ticket:", error)
    return NextResponse.json({ error: "Failed to resolve ticket" }, { status: 500 })
  }
}
