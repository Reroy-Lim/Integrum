import { type NextRequest, NextResponse } from "next/server"
import { n8nApi } from "@/lib/n8n-api"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userEmail = searchParams.get("email")

    if (!userEmail) {
      return NextResponse.json({ error: "Email parameter is required" }, { status: 400 })
    }

    try {
      const { success, execution } = await n8nApi.hasRecentSuccessfulExecution(userEmail)

      if (success && execution) {
        console.log("[v0] Found successful n8n execution:", execution.id)

        // Now check if we have the acknowledgement with ticket details
        const ackResponse = await fetch(
          `${request.nextUrl.origin}/api/acknowledgement/status?email=${encodeURIComponent(userEmail)}`,
          { cache: "no-store" },
        )

        if (ackResponse.ok) {
          const ackData = await ackResponse.json()

          if (ackData.acknowledged && ackData.data?.ticketId) {
            // Both workflow completed and acknowledgement received
            return NextResponse.json({
              status: "completed",
              message: "Ticket created successfully!",
              ticketKey: ackData.data.ticketId,
              workflowExecutionId: execution.id,
              executionTime: execution.stoppedAt,
            })
          }
        }

        // Workflow completed but no acknowledgement yet
        return NextResponse.json({
          status: "processing",
          message: "Workflow completed, finalizing ticket details...",
          workflowExecutionId: execution.id,
        })
      }
    } catch (n8nError) {
      console.log("[v0] N8N API not available, falling back to Jira check:", n8nError)
      // Fall through to Jira-based check
    }

    const jiraBaseUrl = process.env.JIRA_BASE_URL
    const jiraEmail = process.env.JIRA_EMAIL
    const jiraApiToken = process.env.JIRA_API_TOKEN
    const projectKey = process.env.JIRA_PROJECT_KEY

    if (!jiraBaseUrl || !jiraEmail || !jiraApiToken || !projectKey) {
      return NextResponse.json({ error: "Jira configuration missing" }, { status: 500 })
    }

    const auth = Buffer.from(`${jiraEmail}:${jiraApiToken}`).toString("base64")

    // Query for tickets created in the last 10 minutes for this user
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString().replace("Z", "+0000")
    const jql = `project = ${projectKey} AND created >= "${tenMinutesAgo}" AND description ~ "${userEmail}" ORDER BY created DESC`

    const response = await fetch(
      `${jiraBaseUrl}/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=5&fields=key,summary,created`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
        },
      },
    )

    if (!response.ok) {
      console.error("[v0] Jira API error:", response.status, response.statusText)
      return NextResponse.json({ status: "pending", message: "Checking workflow status..." }, { status: 200 })
    }

    const data = await response.json()

    if (data.issues && data.issues.length > 0) {
      // Found a recently created ticket for this user
      const latestTicket = data.issues[0]
      return NextResponse.json({
        status: "completed",
        message: "Ticket created successfully!",
        ticketKey: latestTicket.key,
        ticketSummary: latestTicket.fields.summary,
      })
    }

    // No ticket found yet, workflow still processing
    return NextResponse.json({
      status: "pending",
      message: "Ticket is being created, please wait...",
    })
  } catch (error) {
    console.error("[v0] Error checking workflow status:", error)
    return NextResponse.json(
      {
        status: "pending",
        message: "Checking workflow status...",
      },
      { status: 200 },
    )
  }
}
