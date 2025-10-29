import { type NextRequest, NextResponse } from "next/server"
import { JiraApiClient, type JiraConfig } from "@/lib/jira-api"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ticketKey, resolution } = body

    if (!ticketKey || !resolution) {
      return NextResponse.json({ error: "Ticket key and resolution are required" }, { status: 400 })
    }

    console.log(`[v0] Update Resolution API: Updating ${ticketKey} to resolution "${resolution}"`)

    const jiraConfig: JiraConfig = {
      baseUrl: process.env.JIRA_BASE_URL || "",
      email: process.env.JIRA_EMAIL || "",
      apiToken: process.env.JIRA_API_TOKEN || "",
      projectKey: process.env.JIRA_PROJECT_KEY || "",
    }

    const jiraClient = new JiraApiClient(jiraConfig)
    const success = await jiraClient.updateTicketResolution(ticketKey, resolution)

    if (success) {
      console.log(`[v0] Update Resolution API: ✅ Successfully updated resolution for ${ticketKey}`)
      return NextResponse.json({ success: true, message: "Resolution updated successfully" }, { status: 200 })
    } else {
      console.log(`[v0] Update Resolution API: ❌ Failed to update resolution for ${ticketKey}`)
      return NextResponse.json({ error: "Failed to update resolution" }, { status: 500 })
    }
  } catch (error) {
    console.error("[v0] Update Resolution API: Error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
