import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { userEmail, emailTimestamp } = await request.json()

    if (!userEmail) {
      return NextResponse.json({ error: "User email is required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("pending_tickets")
      .insert({
        user_email: userEmail,
        status: "pending",
        email_timestamp: emailTimestamp || Date.now(),
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating pending ticket:", error)
      return NextResponse.json({ error: "Failed to create pending ticket" }, { status: 500 })
    }

    console.log("[v0] Created pending ticket:", data.id)

    return NextResponse.json({ pendingTicket: data }, { status: 201 })
  } catch (error) {
    console.error("[v0] Error in pending tickets API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const userEmail = searchParams.get("email")

    if (!id && !userEmail) {
      return NextResponse.json({ error: "ID or email is required" }, { status: 400 })
    }

    const supabase = await createClient()

    if (id) {
      const { data, error } = await supabase.from("pending_tickets").select("*").eq("id", id).single()

      if (error) {
        console.error("[v0] Error fetching pending ticket:", error)
        return NextResponse.json({ error: "Pending ticket not found" }, { status: 404 })
      }

      return NextResponse.json({ pendingTicket: data })
    } else {
      const { data, error } = await supabase
        .from("pending_tickets")
        .select("*")
        .eq("user_email", userEmail)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("[v0] Error fetching pending tickets:", error)
        return NextResponse.json({ error: "Failed to fetch pending tickets" }, { status: 500 })
      }

      return NextResponse.json({ pendingTickets: data || [] })
    }
  } catch (error) {
    console.error("[v0] Error in pending tickets API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
