import { type NextRequest, NextResponse } from "next/server"
import { JiraApiClient } from "@/lib/jira-api"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userEmail = searchParams.get("email")

  console.log("[v0] Jira API Route: Request for user:", userEmail)

  if (!userEmail) {
    return NextResponse.json({ error: "User email is required" }, { status: 400 })
  }

  try {
    const jiraConfig = {
      baseUrl: process.env.JIRA_BASE_URL || "",
      email: process.env.JIRA_EMAIL || "",
      apiToken: process.env.JIRA_API_TOKEN || "",
      projectKey: process.env.JIRA_PROJECT_KEY || "HELP",
    }

    console.log(
      "[v0] Jira API Route: Config check - URL:",
      !!jiraConfig.baseUrl,
      "| Email:",
      !!jiraConfig.email,
      "| Token:",
      !!jiraConfig.apiToken,
      "| Project:",
      jiraConfig.projectKey,
    )

    if (!jiraConfig.baseUrl || !jiraConfig.email || !jiraConfig.apiToken) {
      console.error("[v0] Jira API Route: Missing required environment variables")
      return NextResponse.json(
        {
          error: "Jira configuration is incomplete",
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
    const tickets = await jiraClient.getTicketsByUser(userEmail)

    console.log("[v0] Jira API Route: Returning", tickets.length, "tickets")
    return NextResponse.json({ tickets })
  } catch (error) {
    console.error("[v0] Jira API Route: Error:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json(
      {
        error: "Failed to fetch tickets",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
