import { type NextRequest, NextResponse } from "next/server"
import { JiraApiClient } from "@/lib/jira-api"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userEmail = searchParams.get("email")
  const limit = searchParams.get("limit")
  const requestedLimit = limit ? Number.parseInt(limit, 10) : 50

  const masterEmail = process.env.NEXT_PUBLIC_MASTER_EMAIL || "heyroy23415@gmail.com"
  const isMasterAccount = userEmail?.toLowerCase() === masterEmail.toLowerCase()

  // Enforce limits: 1000 for master, 500 for regular users
  const maxAllowedLimit = isMasterAccount ? 1000 : 500
  const maxResults = Math.min(requestedLimit, maxAllowedLimit)

  console.log(`[v0] Jira API Route: Fetching ${maxResults} tickets in single request for user: ${userEmail}`)
  // </CHANGE>

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
    const result = await jiraClient.getTicketsByUser(userEmail, maxResults, requestedLimit)
    // </CHANGE>

    console.log(
      `[v0] Jira API Route: Pagination complete - Returning ${result.tickets.length} of ${requestedLimit} requested`,
    )

    return NextResponse.json({
      tickets: result.tickets,
      metadata: {
        requested: requestedLimit,
        returned: result.tickets.length,
        total: result.total,
      },
    })
    // </CHANGE>
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
