import { type NextRequest, NextResponse } from "next/server"
import { JiraApiClient, type JiraConfig } from "@/lib/jira-api"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Sync API: Starting sync of all ticket categories to Jira statuses")

    const body = await request.json()
    const { userEmail } = body

    if (!userEmail) {
      return NextResponse.json({ error: "User email is required" }, { status: 400 })
    }

    console.log("[v0] Sync API: Syncing tickets for user:", userEmail)

    const supabase = await createClient()

    const { data: allTickets, error: supabaseError } = await supabase
      .from("ticket_categories")
      .select("ticket_key, category")

    if (supabaseError) {
      console.error("[v0] Sync API: Error fetching tickets from Supabase:", supabaseError)
      return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 })
    }

    console.log("[v0] Sync API: Found", allTickets?.length || 0, "tickets with categories")

    if (!allTickets || allTickets.length === 0) {
      console.log("[v0] Sync API: No tickets to sync")
      return NextResponse.json({ message: "No tickets to sync", updated: 0 }, { status: 200 })
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
    const categoryStats = {
      "In Progress": { total: 0, updated: 0 },
      "Pending Reply": { total: 0, updated: 0 },
      Resolved: { total: 0, updated: 0 },
    }

    for (const ticket of allTickets) {
      try {
        const category = ticket.category

        // Track category statistics
        if (categoryStats[category as keyof typeof categoryStats]) {
          categoryStats[category as keyof typeof categoryStats].total++
        }

        console.log(`[v0] Sync API: Syncing ticket ${ticket.ticket_key} with category "${category}"`)

        // Use the new syncCategoryToJiraStatus method
        const success = await jiraClient.syncCategoryToJiraStatus(ticket.ticket_key, category)

        if (success) {
          updatedCount++
          if (categoryStats[category as keyof typeof categoryStats]) {
            categoryStats[category as keyof typeof categoryStats].updated++
          }
          console.log(`[v0] Sync API: ✅ Successfully synced ticket ${ticket.ticket_key}`)
        } else {
          errors.push(`Failed to sync ${ticket.ticket_key} (category: ${category})`)
          console.log(`[v0] Sync API: ⚠️ Could not sync ticket ${ticket.ticket_key}`)
        }
      } catch (error) {
        const errorMsg = `Error syncing ${ticket.ticket_key}: ${error instanceof Error ? error.message : "Unknown error"}`
        errors.push(errorMsg)
        console.error(`[v0] Sync API: ${errorMsg}`)
      }
    }

    console.log(`[v0] Sync API: Sync complete. Updated ${updatedCount} of ${allTickets.length} tickets`)
    console.log("[v0] Sync API: Category breakdown:", categoryStats)

    return NextResponse.json(
      {
        message: "Sync completed",
        updated: updatedCount,
        total: allTickets.length,
        categoryStats,
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
