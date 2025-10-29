import { type NextRequest, NextResponse } from "next/server"
import { JiraApiClient } from "@/lib/jira-api"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userEmail = searchParams.get("email")
  const limit = searchParams.get("limit")
  const userRequestedLimit = limit ? Number.parseInt(limit, 10) : 50

  console.log("[v0] Jira API Route: Request for user:", userEmail, "with limit:", userRequestedLimit)

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
    const allTickets: any[] = []
    let startAt = 0
    const maxResultsPerRequest = 50 // Always 50 per Jira API call
    let totalAvailable = 0

    console.log(
      "[v0] Jira API Route: Starting pagination - User limit:",
      userRequestedLimit,
      "| Per request:",
      maxResultsPerRequest,
    )

    // Loop until we have enough tickets or no more available
    while (startAt < userRequestedLimit) {
      console.log("[v0] Jira API Route: Fetching batch starting at:", startAt, "| Current total:", allTickets.length)

      const result = await jiraClient.getTicketsByUser(userEmail, maxResultsPerRequest, startAt)
      totalAvailable = result.total

      if (result.tickets.length === 0) {
        console.log("[v0] Jira API Route: No more tickets available, stopping pagination")
        break
      }

      allTickets.push(...result.tickets)
      console.log("[v0] Jira API Route: Added", result.tickets.length, "tickets. Total now:", allTickets.length)

      // Stop if we've reached the user's requested limit
      if (allTickets.length >= userRequestedLimit) {
        console.log("[v0] Jira API Route: Reached user requested limit, stopping pagination")
        break
      }

      // Stop if we've fetched all available tickets
      if (startAt + maxResultsPerRequest >= totalAvailable) {
        console.log("[v0] Jira API Route: Fetched all available tickets, stopping pagination")
        break
      }

      startAt += maxResultsPerRequest
    }

    // Trim to exact user limit if we fetched more
    const finalTickets = allTickets.slice(0, userRequestedLimit)

    console.log(
      "[v0] Jira API Route: Pagination complete - Returning",
      finalTickets.length,
      "tickets out of",
      totalAvailable,
      "total available",
    )

    return NextResponse.json({
      tickets: finalTickets,
      total: totalAvailable,
      showing: finalTickets.length,
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
