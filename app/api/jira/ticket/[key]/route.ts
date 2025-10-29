import { type NextRequest, NextResponse } from "next/server"
import { JiraApiClient, getCategoryToJiraMapping } from "@/lib/jira-api"

export async function GET(request: NextRequest, { params }: { params: { key: string } }) {
  const ticketKey = params.key

  try {
    const jiraConfig = {
      baseUrl: process.env.JIRA_BASE_URL || "",
      email: process.env.JIRA_EMAIL || "",
      apiToken: process.env.JIRA_API_TOKEN || "",
      projectKey: process.env.JIRA_PROJECT_KEY || "HELP",
    }

    const jiraClient = new JiraApiClient(jiraConfig)
    const ticket = await jiraClient.getTicket(ticketKey)

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error("Error fetching JIRA ticket:", error)
    return NextResponse.json({ error: "Failed to fetch ticket" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { key: string } }) {
  const ticketKey = params.key

  try {
    const body = await request.json()
    const { action } = body

    if (action !== "resolve") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    console.log("[v0] ===== RESOLVE TICKET START =====")
    console.log("[v0] Resolving ticket:", ticketKey)

    const jiraConfig = {
      baseUrl: process.env.JIRA_BASE_URL || "",
      email: process.env.JIRA_EMAIL || "",
      apiToken: process.env.JIRA_API_TOKEN || "",
      projectKey: process.env.JIRA_PROJECT_KEY || "HELP",
    }

    const mapping = getCategoryToJiraMapping("Resolved")
    console.log(
      `[v0] Applying mapping: Frontend "Resolved" → Jira "${mapping.status}" + Resolution "${mapping.resolution}"`,
    )

    const jiraClient = new JiraApiClient(jiraConfig)

    const success = await jiraClient.transitionTicket(ticketKey, mapping.status, mapping.resolution)

    if (!success) {
      return NextResponse.json({ error: "Failed to resolve ticket" }, { status: 500 })
    }

    console.log(`[v0] ✅ Successfully resolved ticket: Status="${mapping.status}", Resolution="${mapping.resolution}"`)
    console.log("[v0] ===== RESOLVE TICKET END =====")

    return NextResponse.json({ success: true, message: "Ticket resolved successfully" })
  } catch (error) {
    console.error("[v0] Error resolving JIRA ticket:", error)
    return NextResponse.json({ error: "Failed to resolve ticket" }, { status: 500 })
  }
}
