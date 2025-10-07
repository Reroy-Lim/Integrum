import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { ticketId, customerEmail, submissionTimestamp } = await request.json()

    if (!ticketId || !customerEmail || !submissionTimestamp) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Verify timestamp is within acceptable range (1-10 minutes)
    const currentTime = Date.now()
    const timeDifference = Math.abs(currentTime - submissionTimestamp)
    const minTimeDifference = 1 * 60 * 1000 // 1 minute minimum
    const maxTimeDifference = 10 * 60 * 1000 // 10 minutes maximum

    if (timeDifference < minTimeDifference) {
      return NextResponse.json(
        {
          verified: false,
          error: "Too soon - please wait for auto-acknowledgement email",
          timeRemaining: Math.ceil((minTimeDifference - timeDifference) / 1000),
        },
        { status: 400 },
      )
    }

    if (timeDifference > maxTimeDifference) {
      return NextResponse.json(
        {
          verified: false,
          error: "Return link expired - please submit a new ticket",
        },
        { status: 400 },
      )
    }

    // In a real implementation, you would also verify:
    // 1. Check if auto-acknowledgement email was actually sent
    // 2. Verify the ticket exists in your system
    // 3. Check if user has permission to access this ticket

    console.log(`[v0] Verified acknowledgement for ticket ${ticketId} from ${customerEmail}`)

    return NextResponse.json({
      verified: true,
      ticketId,
      message: "Auto-acknowledgement verified successfully",
      redirectUrl: `/ticket/${ticketId}`,
    })
  } catch (error) {
    console.error("[v0] Error verifying acknowledgement:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
