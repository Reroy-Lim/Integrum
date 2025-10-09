import { type NextRequest, NextResponse } from "next/server"
import { JiraApiClient } from "@/lib/jira-api"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userEmail = searchParams.get("email")

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

    const jiraClient = new JiraApiClient(jiraConfig)

    const allTickets = await jiraClient.getAllProjectTickets()

    const userTickets = allTickets.filter((ticket) => {
      if (!ticket.description) return false

      // Extract email from description (From: email@example.com)
      const fromMatch = ticket.description.match(/From:\s*([^\s\n]+@[^\s\n]+)/i)
      const customerEmail = fromMatch ? fromMatch[1].trim().toLowerCase() : null

      return customerEmail === userEmail.toLowerCase()
    })

    return NextResponse.json({ tickets: userTickets })
  } catch (error) {
    console.error("Error fetching JIRA tickets:", error)
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 })
  }
}
