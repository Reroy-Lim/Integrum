import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const ticketKey = searchParams.get("ticketKey")

    if (!ticketKey) {
      return NextResponse.json({ error: "Ticket key is required" }, { status: 400 })
    }

    console.log("[v0] Fetching chat messages for ticket:", ticketKey)

    const supabase = await createClient()

    const { data: messages, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("ticket_key", ticketKey)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching messages:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Fetched", messages?.length || 0, "messages")

    return NextResponse.json({ messages: messages || [] })
  } catch (error) {
    console.error("[v0] Error in GET /api/chat-messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ticketKey, userEmail, message, role } = body

    if (!ticketKey || !userEmail || !message || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log("[v0] Saving chat message:", { ticketKey, userEmail, role, messageLength: message.length })

    const supabase = await createClient()

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

    console.log("[v0] Message saved successfully:", data.id)

    return NextResponse.json({ message: data })
  } catch (error) {
    console.error("[v0] Error in POST /api/chat-messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
