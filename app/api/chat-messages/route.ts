import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

// GET: Fetch messages for a ticket
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const ticketKey = searchParams.get("ticketKey")

    if (!ticketKey) {
      return NextResponse.json({ error: "Ticket key is required" }, { status: 400 })
    }

    // Get user email from cookies
    const cookieStore = await cookies()
    const userEmail = cookieStore.get("user_email")?.value

    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()

    // Fetch messages for this ticket
    const { data: messages, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("ticket_key", ticketKey)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching messages:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("[v0] Error in GET /api/chat-messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST: Save a new message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ticketKey, message, role } = body

    if (!ticketKey || !message || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get user email from cookies
    const cookieStore = await cookies()
    const userEmail = cookieStore.get("user_email")?.value

    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()

    // Insert message
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        ticket_key: ticketKey,
        user_email: userEmail,
        message,
        role,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error saving message:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: data })
  } catch (error) {
    console.error("[v0] Error in POST /api/chat-messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
