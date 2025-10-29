import { type NextRequest, NextResponse } from "next/server"
import { JiraApiClient, type JiraConfig } from "@/lib/jira-api"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Sync API: Starting sync of Pending Reply tickets to In Progress")

    const body = await request.json()
    const { userEmail } = body

    if (!userEmail) {
      return NextResponse.json({ error: "User email is required" }, { status: 400 })
    }

    console.log("[v0] Sync API: Syncing tickets for user:", userEmail)

    const supabase = await createClient()

    const { data: pendingTickets, error: supabaseError } = await supabase
      .from("ticket_categories")
      .select("ticket_key, category")
      .eq("category", "Pending Reply")

    if (supabaseError) {
      console.error("[v0] Sync API: Error fetching pending tickets from Supabase:", supabaseError)
      return NextResponse.json({ error: "Failed to fetch pending tickets" }, { status: 500 })
    }

    console.log("[v0] Sync API: Found", pendingTickets?.length || 0, "tickets in Pending Reply category")

    if (!pendingTickets || pendingTickets.length === 0) {
      console.log("[v0] Sync API: No pending tickets to sync")
      return NextResponse.json({ message: "No pending tickets to sync", updated: 0 }, { status: 200 })
    }

    const jiraConfig: JiraConfig = {
      baseUrl: process.env.JIRA_BASE_URL || "",
      email: process.env.JIRA_EMAIL || "",
      apiToken: process.env.JIRA_API_TOKEN || "",
      projectKey: process.env.JIRA_PROJECT_KEY || "",
    }

    const jiraClient = new JiraApiClient(jiraConfig)

    let updatedCount = 0
    const errors: string[] = []

    for (const ticket of pendingTickets) {
      try {
        console.log(`[v0] Sync API: Checking ticket ${ticket.ticket_key}`)

        const jiraTicket = await jiraClient.getTicket(ticket.ticket_key)

        if (!jiraTicket) {
          console.log(`[v0] Sync API: Ticket ${ticket.ticket_key} not found in Jira, skipping`)
          continue
        }

        const currentStatus = jiraTicket.status.name
        console.log(`[v0] Sync API: Ticket ${ticket.ticket_key} current status: ${currentStatus}`)

        if (currentStatus.toLowerCase() !== "in progress") {
          console.log(`[v0] Sync API: Updating ticket ${ticket.ticket_key} from "${currentStatus}" to "In Progress"`)

          const success = await jiraClient.transitionTicket(ticket.ticket_key, "In Progress")

          if (success) {
            updatedCount++
            console.log(`[v0] Sync API: ✅ Successfully updated ticket ${ticket.ticket_key}`)
          } else {
            errors.push(`Failed to update ${ticket.ticket_key}`)
            console.log(`[v0] Sync API: ❌ Failed to update ticket ${ticket.ticket_key}`)
          }
        } else {
          console.log(`[v0] Sync API: Ticket ${ticket.ticket_key} already "In Progress", skipping`)
        }
      } catch (error) {
        const errorMsg = `Error updating ${ticket.ticket_key}: ${error instanceof Error ? error.message : "Unknown error"}`
        errors.push(errorMsg)
        console.error(`[v0] Sync API: ${errorMsg}`)
      }
    }

    console.log(`[v0] Sync API: Sync complete. Updated ${updatedCount} tickets`)

    return NextResponse.json(
      {
        message: "Sync completed",
        updated: updatedCount,
        total: pendingTickets.length,
        errors: errors.length > 0 ? errors : undefined,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] Sync API: Unexpected error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
