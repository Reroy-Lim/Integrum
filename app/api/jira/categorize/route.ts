import { type NextRequest, NextResponse } from "next/server"
import { JiraApiClient } from "@/lib/jira-api"

export async function POST(request: NextRequest) {
  try {
    const { ticketKeys } = await request.json()

    if (!Array.isArray(ticketKeys)) {
      return NextResponse.json({ error: "ticketKeys must be an array" }, { status: 400 })
    }

    const jiraConfig = {
      baseUrl: process.env.JIRA_BASE_URL || "",
      email: process.env.JIRA_EMAIL || "",
      apiToken: process.env.JIRA_API_TOKEN || "",
      projectKey: process.env.JIRA_PROJECT_KEY || "HELP",
    }

    const jiraClient = new JiraApiClient(jiraConfig)
    const categorizedTickets: Array<{ ticketKey: string; customerEmail: string | null }> = []

    // Fetch each ticket and extract customer email
    for (const ticketKey of ticketKeys) {
      const ticket = await jiraClient.getTicket(ticketKey)

      if (ticket && ticket.description) {
        // Extract email from description (From: email@example.com)
        const fromMatch = ticket.description.match(/From:\s*([^\s\n]+@[^\s\n]+)/i)
        const customerEmail = fromMatch ? fromMatch[1].trim() : null

        categorizedTickets.push({
          ticketKey: ticket.key,
          customerEmail,
        })
      }
    }

    return NextResponse.json({ categorizedTickets })
  } catch (error) {
    console.error("Error categorizing tickets:", error)
    return NextResponse.json({ error: "Failed to categorize tickets" }, { status: 500 })
  }
}
