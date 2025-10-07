import { type NextRequest, NextResponse } from "next/server"
import acknowledgementStore from "@/lib/acknowledgement-store"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerEmail = searchParams.get("email")

    if (!customerEmail) {
      return NextResponse.json(
        {
          success: false,
          message: "Email parameter required",
        },
        { status: 400 },
      )
    }

    const acknowledgementData = acknowledgementStore.get(customerEmail)

    if (acknowledgementData && acknowledgementData.acknowledged && acknowledgementData.verified) {
      return NextResponse.json({
        success: true,
        acknowledged: true,
        data: acknowledgementData,
        latestTicket: acknowledgementData.latestTicket || null,
        verified: true, // Indicate this acknowledgement has been verified
      })
    }

    return NextResponse.json({
      success: true,
      acknowledged: false,
      verified: false,
    })
  } catch (error) {
    console.error("Status check error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}
