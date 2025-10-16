import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("acknowledgements")
      .select("*")
      .eq("customer_email", customerEmail)
      .eq("verified", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching acknowledgement:", error)
      return NextResponse.json(
        {
          success: false,
          message: "Internal server error",
        },
        { status: 500 },
      )
    }

    if (data && data.acknowledged && data.verified) {
      return NextResponse.json({
        success: true,
        acknowledged: true,
        data: {
          ticketId: data.ticket_key,
          messageId: data.message_id,
          timestamp: data.created_at,
          acknowledged: data.acknowledged,
          verified: data.verified,
        },
        verified: true,
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
