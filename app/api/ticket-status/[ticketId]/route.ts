import { type NextRequest, NextResponse } from "next/server"
import { getJiraTicket } from "@/lib/jira-api"

export async function GET(request: NextRequest, { params }: { params: { ticketId: string } }) {
  try {
    const { ticketId } = params

    console.log("[v0] Checking ticket status for:", ticketId)

    try {
      const ticket = await getJiraTicket(ticketId)

      if (ticket) {
        console.log("[v0] Ticket found:", ticketId, "Status:", ticket.status.name)

        return NextResponse.json({
          status: "done",
          ticket: {
            key: ticket.key,
            summary: ticket.summary,
            status: ticket.status.name,
          },
        })
      }
    } catch (error) {
      console.log("[v0] Ticket not found yet:", ticketId)

      return NextResponse.json({
        status: "processing",
        message: "Ticket is being created",
      })
    }

    return NextResponse.json({
      status: "processing",
      message: "Ticket is being created",
    })
  } catch (error) {
    console.error("[v0] Error checking ticket status:", error)

    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Failed to check ticket status",
      },
      { status: 500 },
    )
  }
}
