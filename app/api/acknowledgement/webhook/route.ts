import { type NextRequest, NextResponse } from "next/server"
import { JiraApiClient } from "@/lib/jira-api"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customerEmail, ticketId, messageId, status, emailTimestamp } = body

    if (status === "acknowledgement_sent") {
      let latestTicket = null
      let isValidAcknowledgement = false

      if (customerEmail) {
        try {
          const jiraConfig = {
            baseUrl: process.env.JIRA_BASE_URL || "",
            email: process.env.JIRA_EMAIL || "",
            apiToken: process.env.JIRA_API_TOKEN || "",
            projectKey: process.env.JIRA_PROJECT_KEY || "KST",
          }

          const jiraClient = new JiraApiClient(jiraConfig)
          latestTicket = await jiraClient.getLatestTicketByUser(customerEmail)

          if (latestTicket && emailTimestamp) {
            const ticketCreatedTime = new Date(latestTicket.created).getTime()
            const emailTime = new Date(emailTimestamp).getTime()
            const timeDifference = Math.abs(emailTime - ticketCreatedTime)
            const maxTimeDifference = 10 * 60 * 1000

            if (timeDifference <= maxTimeDifference) {
              isValidAcknowledgement = true
            }
          } else if (latestTicket) {
            const ticketCreatedTime = new Date(latestTicket.created).getTime()
            const currentTime = new Date().getTime()
            const timeSinceCreation = currentTime - ticketCreatedTime
            const maxRecentTime = 15 * 60 * 1000

            if (timeSinceCreation <= maxRecentTime) {
              isValidAcknowledgement = true
            }
          }
        } catch (error) {
          console.error("Error fetching latest ticket in webhook:", error)
        }
      }

      if (isValidAcknowledgement && latestTicket) {
        const supabase = await createClient()

        const { error } = await supabase.from("acknowledgements").insert({
          customer_email: customerEmail,
          ticket_key: latestTicket.key,
          message_id: messageId,
          email_timestamp: emailTimestamp,
          acknowledged: true,
          verified: true,
        })

        if (error) {
          console.error("Error storing acknowledgement:", error)
          return NextResponse.json(
            {
              success: false,
              message: "Failed to store acknowledgement",
            },
            { status: 500 },
          )
        }

        return NextResponse.json({
          success: true,
          message: "Acknowledgement status recorded and verified",
          latestTicket: latestTicket.key,
          verified: true,
        })
      } else {
        return NextResponse.json(
          {
            success: false,
            message: "Acknowledgement verification failed - time mismatch or no recent ticket found",
            verified: false,
          },
          { status: 400 },
        )
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: "Invalid webhook payload",
      },
      { status: 400 },
    )
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}
