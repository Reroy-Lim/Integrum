import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { JiraApiClient, type JiraConfig } from "@/lib/jira-api"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Sync Category API: Starting sync of all categorized tickets to Jira")

    // Initialize Supabase client
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Initialize Jira client
    const jiraConfig: JiraConfig = {
      baseUrl: process.env.JIRA_BASE_URL || "",
      email: process.env.JIRA_EMAIL || "",
      apiToken: process.env.JIRA_API_TOKEN || "",
      projectKey: process.env.JIRA_PROJECT_KEY || "",
    }
    const jiraClient = new JiraApiClient(jiraConfig)

    // Fetch all tickets with categories
    const { data: categorizedTickets, error } = await supabase.from("ticket_categories").select("*")

    if (error) {
      console.error("[v0] Sync Category API: Error fetching categorized tickets:", error)
      return NextResponse.json({ error: "Failed to fetch categorized tickets" }, { status: 500 })
    }

    if (!categorizedTickets || categorizedTickets.length === 0) {
      console.log("[v0] Sync Category API: No categorized tickets found")
      return NextResponse.json({
        success: true,
        message: "No tickets to sync",
        updated: 0,
      })
    }

    console.log(`[v0] Sync Category API: Found ${categorizedTickets.length} categorized tickets`)

    // Process each ticket
    let updatedCount = 0
    let failedCount = 0

    for (const ticket of categorizedTickets) {
      const { ticket_key, category } = ticket

      // Validate category
      if (!["In Progression", "Pending Reply", "Resolved"].includes(category)) {
        console.warn(`[v0] Sync Category API: Invalid category "${category}" for ticket ${ticket_key}, skipping`)
        continue
      }

      console.log(`[v0] Sync Category API: Processing ticket ${ticket_key} with category "${category}"`)

      // Update Jira status and resolution
      const success = await jiraClient.updateTicketStatusAndResolution(
        ticket_key,
        category as "In Progression" | "Pending Reply" | "Resolved",
      )

      if (success) {
        updatedCount++
        console.log(`[v0] Sync Category API: ✅ Successfully synced ticket ${ticket_key}`)
      } else {
        failedCount++
        console.error(`[v0] Sync Category API: ❌ Failed to sync ticket ${ticket_key}`)
      }

      // Add a small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    console.log(`[v0] Sync Category API: Sync complete. Updated: ${updatedCount}, Failed: ${failedCount}`)

    return NextResponse.json({
      success: true,
      message: `Synced ${updatedCount} tickets successfully`,
      updated: updatedCount,
      failed: failedCount,
      total: categorizedTickets.length,
    })
  } catch (error) {
    console.error("[v0] Sync Category API: Error:", error)
    return NextResponse.json({ error: "Failed to sync categories to Jira" }, { status: 500 })
  }
}
