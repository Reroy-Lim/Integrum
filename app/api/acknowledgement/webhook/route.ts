import { type NextRequest, NextResponse } from "next/server"
import { JiraApiClient } from "@/lib/jira-api"
import acknowledgementStore from "@/lib/acknowledgement-store"
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
              console.log(
                `[v0] Valid acknowledgement: Email time ${emailTimestamp} matches ticket created time ${latestTicket.created}`,
              )
            } else {
              console.log(
                `[v0] Invalid acknowledgement: Time difference too large (${timeDifference}ms) between email and ticket`,
              )
            }
          } else if (latestTicket) {
            const ticketCreatedTime = new Date(latestTicket.created).getTime()
            const currentTime = new Date().getTime()
            const timeSinceCreation = currentTime - ticketCreatedTime
            const maxRecentTime = 15 * 60 * 1000

            if (timeSinceCreation <= maxRecentTime) {
              isValidAcknowledgement = true
              console.log(`[v0] Valid acknowledgement: Recent ticket created ${latestTicket.created}`)
            } else {
              console.log(`[v0] Invalid acknowledgement: Ticket too old (${timeSinceCreation}ms ago)`)
            }
          }
        } catch (error) {
          console.error("Error fetching latest ticket in webhook:", error)
        }
      }

      if (isValidAcknowledgement && latestTicket) {
        acknowledgementStore.set(customerEmail, {
          ticketId: latestTicket.key,
          messageId,
          timestamp: new Date().toISOString(),
          acknowledged: true,
          latestTicket,
          emailTimestamp,
          verified: true,
        })

        try {
          const supabase = await createClient()

          const { error } = await supabase
            .from("pending_tickets")
            .update({
              status: "created",
              ticket_key: latestTicket.key,
              updated_at: new Date().toISOString(),
            })
            .eq("user_email", customerEmail)
            .eq("status", "pending")
            .order("created_at", { ascending: false })
            .limit(1)

          if (error) {
            console.error("[v0] Error updating pending ticket:", error)
          } else {
            console.log("[v0] Updated pending ticket status to 'created' for", customerEmail)
          }
        } catch (error) {
          console.error("[v0] Error updating pending ticket in Supabase:", error)
        }

        return NextResponse.json({
          success: true,
          message: "Acknowledgement status recorded and verified",
          latestTicket: latestTicket.key,
          verified: true,
        })
      } else {
        try {
          const supabase = await createClient()

          await supabase
            .from("pending_tickets")
            .update({
              status: "failed",
              error_message: "Acknowledgement verification failed - time mismatch or no recent ticket found",
              updated_at: new Date().toISOString(),
            })
            .eq("user_email", customerEmail)
            .eq("status", "pending")
            .order("created_at", { ascending: false })
            .limit(1)
        } catch (error) {
          console.error("[v0] Error updating failed pending ticket:", error)
        }

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
