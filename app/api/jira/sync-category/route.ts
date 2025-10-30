import { type NextRequest, NextResponse } from "next/server"
import { JiraApiClient, type JiraConfig } from "@/lib/jira-api"

export async function POST(request: NextRequest) {
  try {
    const { ticketKey, category } = await request.json()

    if (!ticketKey || !category) {
      return NextResponse.json({ error: "Missing ticketKey or category" }, { status: 400 })
    }

    console.log(`[v0] Sync API: Syncing ticket ${ticketKey} with category "${category}"`)

    const jiraConfig: JiraConfig = {
      baseUrl: process.env.JIRA_BASE_URL || "",
      email: process.env.JIRA_EMAIL || "",
      apiToken: process.env.JIRA_API_TOKEN || "",
      projectKey: process.env.JIRA_PROJECT_KEY || "",
    }

    const jiraClient = new JiraApiClient(jiraConfig)
    const success = await jiraClient.syncTicketWithCategory(ticketKey, category)

    if (success) {
      console.log(`[v0] Sync API: ✅ Successfully synced ticket ${ticketKey}`)
      return NextResponse.json({ success: true, message: "Ticket synced successfully" })
    } else {
      console.log(`[v0] Sync API: ⚠️ Failed to sync ticket ${ticketKey}`)
      return NextResponse.json({ success: false, message: "Failed to sync ticket" }, { status: 500 })
    }
  } catch (error) {
    console.error("[v0] Sync API: Error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
