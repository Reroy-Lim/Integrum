import { type NextRequest, NextResponse } from "next/server"
import { JiraApiClient } from "@/lib/jira-api"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userEmail = searchParams.get("userEmail")

  if (!userEmail) {
    return NextResponse.json({ error: "User email is required" }, { status: 400 })
  }

  try {
    const jiraConfig = {
      baseUrl: process.env.JIRA_BASE_URL || "",
      email: process.env.JIRA_EMAIL || "",
      apiToken: process.env.JIRA_API_TOKEN || "",
      projectKey: process.env.JIRA_PROJECT_KEY || "KST",
    }

    const jiraClient = new JiraApiClient(jiraConfig)
    const latestTicket = await jiraClient.getLatestTicketByUser(userEmail)

    return NextResponse.json({ ticket: latestTicket })
  } catch (error) {
    console.error("Error fetching latest JIRA ticket:", error)
    return NextResponse.json({ error: "Failed to fetch latest ticket" }, { status: 500 })
  }
}
