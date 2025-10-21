import { type NextRequest, NextResponse } from "next/server"
import { JiraApiClient } from "@/lib/jira-api"

export async function POST(request: NextRequest, { params }: { params: { key: string } }) {
  const ticketKey = params.key

  try {
    const jiraConfig = {
      baseUrl: process.env.JIRA_BASE_URL || "",
      email: process.env.JIRA_EMAIL || "",
      apiToken: process.env.JIRA_API_TOKEN || "",
      projectKey: process.env.JIRA_PROJECT_KEY || "HELP",
    }

    const jiraClient = new JiraApiClient(jiraConfig)

    console.log("[v0] Resolving ticket:", ticketKey)
    const success = await jiraClient.resolveTicket(ticketKey)

    if (!success) {
      return NextResponse.json({ error: "Failed to resolve ticket" }, { status: 500 })
    }

    console.log("[v0] Ticket resolved successfully:", ticketKey)
    return NextResponse.json({ success: true, message: "Ticket resolved successfully" })
  } catch (error) {
    console.error("Error resolving JIRA ticket:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to resolve ticket" },
      { status: 500 },
    )
  }
}
