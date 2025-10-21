import { type NextRequest, NextResponse } from "next/server"
import { JiraApiClient } from "@/lib/jira-api"

export async function POST(request: NextRequest, { params }: { params: { key: string } }) {
  const ticketKey = params.key

  try {
    console.log("[v0] API: Resolving ticket:", ticketKey)

    const jiraConfig = {
      baseUrl: process.env.JIRA_BASE_URL || "",
      email: process.env.JIRA_EMAIL || "",
      apiToken: process.env.JIRA_API_TOKEN || "",
      projectKey: process.env.JIRA_PROJECT_KEY || "HELP",
    }

    const jiraClient = new JiraApiClient(jiraConfig)
    const success = await jiraClient.resolveTicket(ticketKey)

    if (!success) {
      return NextResponse.json({ error: "Failed to resolve ticket" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Ticket resolved successfully" })
  } catch (error) {
    console.error("[v0] API: Error resolving ticket:", error)
    return NextResponse.json(
      { error: "Failed to resolve ticket", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
