import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tabId, type, url, ticketId, customerEmail, openedAt, closedAt, durationSeconds } = body

    console.log("[v0] Tab closure notification received:", {
      tabId,
      type,
      ticketId,
      durationSeconds,
    })

    // Log to database or analytics service
    // You can add your own logging logic here

    // For Gmail tabs closed quickly, you might want to send an alert
    if (type === "gmail" && durationSeconds < 30) {
      console.log("[v0] WARNING: Gmail tab closed quickly - possible accidental closure")

      // You could send an email notification or Slack alert here
    }

    return NextResponse.json({
      success: true,
      message: "Tab closure logged successfully",
    })
  } catch (error) {
    console.error("[v0] Error logging tab closure:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to log tab closure",
      },
      { status: 500 },
    )
  }
}
