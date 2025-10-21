import { type NextRequest, NextResponse } from "next/server"
import { JiraApiClient } from "@/lib/jira-api"

export async function POST(request: NextRequest, { params }: { params: { key: string } }) {
  try {
    const ticketKey = params.key

    console.log("[v0] Resolve Ticket API: Request to resolve ticket:", ticketKey)

    const jiraConfig = {
      baseUrl: process.env.JIRA_BASE_URL || "",
      email: process.env.JIRA_EMAIL || "",
      apiToken: process.env.JIRA_API_TOKEN || "",
      projectKey: process.env.JIRA_PROJECT_KEY || "HELP",
    }

    if (!jiraConfig.baseUrl || !jiraConfig.email || !jiraConfig.apiToken) {
      console.error("[v0] Resolve Ticket API: Missing JIRA configuration")
      return NextResponse.json({ success: false, error: "JIRA configuration is incomplete" }, { status: 500 })
    }

    const jiraClient = new JiraApiClient(jiraConfig)
    const success = await jiraClient.transitionTicketToResolved(ticketKey)

    if (success) {
      console.log("[v0] Resolve Ticket API: Ticket resolved successfully")
      return NextResponse.json({ success: true, message: "Ticket resolved successfully" })
    } else {
      console.error("[v0] Resolve Ticket API: Failed to resolve ticket")
      return NextResponse.json({ success: false, error: "Failed to resolve ticket" }, { status: 500 })
    }
  } catch (error) {
    console.error("[v0] Resolve Ticket API: Error:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json(
      {
        success: false,
        error: "Failed to resolve ticket",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
