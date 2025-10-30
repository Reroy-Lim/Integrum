import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { JiraApiClient, type JiraConfig } from "@/lib/jira-api"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] ===== JIRA STATUS SYNC START =====")

    const supabase = await createClient()

    // Fetch all tickets with categories
    const { data: categories, error } = await supabase.from("ticket_categories").select("ticket_key, category")

    if (error) {
      console.error("[v0] Error fetching categories:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!categories || categories.length === 0) {
      console.log("[v0] No categories found to sync")
      return NextResponse.json({ message: "No categories to sync", synced: 0 })
    }

    console.log(`[v0] Found ${categories.length} tickets with categories to sync`)

    const jiraConfig: JiraConfig = {
      baseUrl: process.env.JIRA_BASE_URL || "",
      email: process.env.JIRA_EMAIL || "",
      apiToken: process.env.JIRA_API_TOKEN || "",
      projectKey: process.env.JIRA_PROJECT_KEY || "",
    }

    const jiraClient = new JiraApiClient(jiraConfig)
    let syncedCount = 0
    let failedCount = 0

    // Sync each ticket
    for (const { ticket_key, category } of categories) {
      console.log(`[v0] Syncing ${ticket_key} with category "${category}"`)

      const success = await jiraClient.syncTicketWithCategory(ticket_key, category)

      if (success) {
        syncedCount++
        console.log(`[v0] ✅ Successfully synced ${ticket_key}`)
      } else {
        failedCount++
        console.log(`[v0] ❌ Failed to sync ${ticket_key}`)
      }

      // Add a small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    console.log(`[v0] ===== JIRA STATUS SYNC END =====`)
    console.log(`[v0] Synced: ${syncedCount}, Failed: ${failedCount}`)

    return NextResponse.json({
      message: "Sync completed",
      synced: syncedCount,
      failed: failedCount,
      total: categories.length,
    })
  } catch (error) {
    console.error("[v0] Error in sync-jira-status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
