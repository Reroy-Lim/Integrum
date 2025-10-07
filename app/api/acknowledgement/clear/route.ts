import { type NextRequest, NextResponse } from "next/server"
import acknowledgementStore from "@/lib/acknowledgement-store"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Email parameter required",
        },
        { status: 400 },
      )
    }

    acknowledgementStore.delete(email)

    return NextResponse.json({
      success: true,
      message: "Acknowledgement data cleared",
    })
  } catch (error) {
    console.error("Clear acknowledgement error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}
