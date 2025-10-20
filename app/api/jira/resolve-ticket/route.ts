import { type NextRequest, NextResponse } from "next/server"
import { JiraApiClient, type JiraConfig } from "@/lib/jira-api"

export async function POST(request: NextRequest) {
  try {
    const { ticketKey } = await request.json()

    if (!ticketKey) {
      return NextResponse.json({ error: "Ticket key is required" }, { status: 400 })
    }

    const jiraConfig: JiraConfig = {
      baseUrl: process.env.JIRA_BASE_URL || "",
      email: process.env.JIRA_EMAIL || "",
      apiToken: process.env.JIRA_API_TOKEN || "",
      projectKey: process.env.JIRA_PROJECT_KEY || "",
    }

    const jiraClient = new JiraApiClient(jiraConfig)
    const result = await jiraClient.resolveTicket(ticketKey)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Ticket resolved successfully" })
  } catch (error) {
    console.error("Error resolving ticket:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to resolve ticket" },
      { status: 500 },
    )
  }
}
