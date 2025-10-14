import { type NextRequest, NextResponse } from "next/server"
import { JiraApiClient } from "@/lib/jira-api"

const ADMIN_EMAIL = "heyroy23415@gmail.com"

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
      projectKey: process.env.JIRA_PROJECT_KEY || "KST",
    }

    console.log("[v0] Jira API: Configuration check")
    console.log("[v0] Jira API: Base URL exists:", !!jiraConfig.baseUrl)
    console.log("[v0] Jira API: Email exists:", !!jiraConfig.email)
    console.log("[v0] Jira API: API Token exists:", !!jiraConfig.apiToken)
    console.log("[v0] Jira API: Project Key:", jiraConfig.projectKey)

    if (!jiraConfig.baseUrl || !jiraConfig.email || !jiraConfig.apiToken) {
      console.error("[v0] Jira API: Missing required environment variables")
      return NextResponse.json(
        { error: "Jira configuration is incomplete. Please check environment variables." },
        { status: 500 },
      )
    }

    const jiraClient = new JiraApiClient(jiraConfig)

    const isAdmin = userEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()
    console.log("[v0] Jira API: User is admin:", isAdmin)

    let tickets
    if (isAdmin) {
      console.log("[v0] Jira API: Fetching ALL tickets for admin user")
      tickets = await jiraClient.getAllTickets()
    } else {
      console.log("[v0] Jira API: Fetching tickets for user:", userEmail)
      tickets = await jiraClient.getTicketsByUser(userEmail)
    }

    console.log("[v0] Jira API: Successfully fetched", tickets.length, "tickets")
    if (tickets.length > 0) {
      console.log("[v0] Jira API: Sample ticket:", {
        key: tickets[0].key,
        summary: tickets[0].summary,
        reporter: tickets[0].reporter.emailAddress,
      })
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
