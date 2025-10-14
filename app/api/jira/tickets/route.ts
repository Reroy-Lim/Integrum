import { type NextRequest, NextResponse } from "next/server"
import { JiraApiClient } from "@/lib/jira-api"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userEmail = searchParams.get("email")

  console.log("[v0] Jira API: Received request for user:", userEmail)

  if (!userEmail) {
    console.log("[v0] Jira API: Missing user email")
    return NextResponse.json({ error: "User email is required" }, { status: 400 })
  }

  try {
    const jiraConfig = {
      baseUrl: process.env.JIRA_BASE_URL || "",
      email: process.env.JIRA_EMAIL || "",
      apiToken: process.env.JIRA_API_TOKEN || "",
      projectKey: process.env.JIRA_PROJECT_KEY || "HELP",
    }

    console.log("[v0] Jira API: ===== ENVIRONMENT VARIABLE CHECK =====")
    console.log("[v0] Jira API: Base URL:", jiraConfig.baseUrl || "MISSING")
    console.log("[v0] Jira API: Base URL length:", jiraConfig.baseUrl.length)
    console.log("[v0] Jira API: Email:", jiraConfig.email || "MISSING")
    console.log("[v0] Jira API: Email length:", jiraConfig.email.length)
    console.log("[v0] Jira API: API Token exists:", !!jiraConfig.apiToken)
    console.log("[v0] Jira API: API Token length:", jiraConfig.apiToken.length)
    console.log("[v0] Jira API: Project Key:", jiraConfig.projectKey)
    console.log("[v0] Jira API: =====================================")

    if (!jiraConfig.baseUrl || !jiraConfig.email || !jiraConfig.apiToken) {
      console.error("[v0] Jira API: Missing required environment variables")
      return NextResponse.json(
        {
          error: "Jira configuration is incomplete. Please check environment variables.",
          missing: {
            baseUrl: !jiraConfig.baseUrl,
            email: !jiraConfig.email,
            apiToken: !jiraConfig.apiToken,
          },
        },
        { status: 500 },
      )
    }

    const jiraClient = new JiraApiClient(jiraConfig)
    console.log("[v0] Jira API: Fetching tickets for user:", userEmail)

    const tickets = await jiraClient.getTicketsByUser(userEmail)

    console.log("[v0] Jira API: Successfully fetched", tickets.length, "tickets")
    if (tickets.length > 0) {
      console.log(
        "[v0] Jira API: Sample ticket keys:",
        tickets
          .slice(0, 5)
          .map((t) => t.key)
          .join(", "),
      )
    }
    return NextResponse.json({ tickets })
  } catch (error) {
    console.error("[v0] Jira API: Error fetching tickets:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch tickets",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
