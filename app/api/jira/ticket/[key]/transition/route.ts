import { type NextRequest, NextResponse } from "next/server"
import { JiraApiClient } from "@/lib/jira-api"

export async function POST(request: NextRequest, { params }: { params: { key: string } }) {
  const ticketKey = params.key

  try {
    const body = await request.json()
    const { transitionName = "Done" } = body

    console.log("[v0] Transitioning ticket:", ticketKey, "to", transitionName)

    const jiraConfig = {
      baseUrl: process.env.JIRA_BASE_URL || "",
      email: process.env.JIRA_EMAIL || "",
      apiToken: process.env.JIRA_API_TOKEN || "",
      projectKey: process.env.JIRA_PROJECT_KEY || "HELP",
    }

    const jiraClient = new JiraApiClient(jiraConfig)
    const success = await jiraClient.transitionIssue(ticketKey, transitionName)

    if (!success) {
      return NextResponse.json({ error: "Failed to transition ticket" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Ticket transitioned successfully" })
  } catch (error) {
    console.error("[v0] Error transitioning ticket:", error)
    return NextResponse.json({ error: "Failed to transition ticket" }, { status: 500 })
  }
}
