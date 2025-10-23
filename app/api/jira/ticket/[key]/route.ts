import { type NextRequest, NextResponse } from "next/server"
import { JiraApiClient } from "@/lib/jira-api"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { key: string } }) {
  const ticketKey = params.key

  try {
    const jiraConfig = {
      baseUrl: process.env.JIRA_BASE_URL || "",
      email: process.env.JIRA_EMAIL || "",
      apiToken: process.env.JIRA_API_TOKEN || "",
      projectKey: process.env.JIRA_PROJECT_KEY || "HELP",
    }

    const jiraClient = new JiraApiClient(jiraConfig)
    const ticket = await jiraClient.getTicket(ticketKey)

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error("Error fetching JIRA ticket:", error)
    return NextResponse.json({ error: "Failed to fetch ticket" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { key: string } }) {
  const ticketKey = params.key

  try {
    const body = await request.json()
    const { action } = body

    if (action !== "resolve") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    console.log("[v0] ===== RESOLVING TICKET =====")
    console.log("[v0] Ticket key:", ticketKey)

    const jiraConfig = {
      baseUrl: process.env.JIRA_BASE_URL || "",
      email: process.env.JIRA_EMAIL || "",
      apiToken: process.env.JIRA_API_TOKEN || "",
      projectKey: process.env.JIRA_PROJECT_KEY || "HELP",
    }

    const jiraClient = new JiraApiClient(jiraConfig)

    console.log("[v0] Updating Jira status to Done...")
    const success = await jiraClient.transitionTicket(ticketKey, "Done")

    if (!success) {
      console.error("[v0] ❌ Failed to update Jira status")
      return NextResponse.json({ error: "Failed to resolve ticket" }, { status: 500 })
    }

    console.log("[v0] ✅ Jira status updated successfully")

    console.log("[v0] Updating Supabase ticket category to Resolved...")
    const supabase = await createClient()

    const { error: supabaseError } = await supabase.from("ticket_categories").upsert(
      {
        ticket_key: ticketKey,
        category: "Resolved",
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "ticket_key",
      },
    )

    if (supabaseError) {
      console.error("[v0] ❌ Failed to update Supabase category:", supabaseError)
      // Don't fail the request if Supabase update fails, Jira is the source of truth
      console.warn("[v0] ⚠️ Continuing despite Supabase error - Jira status is updated")
    } else {
      console.log("[v0] ✅ Supabase category updated successfully")
    }

    console.log("[v0] ===== TICKET RESOLVED SUCCESSFULLY =====")
    return NextResponse.json({ success: true, message: "Ticket resolved successfully" })
  } catch (error) {
    console.error("[v0] ❌ Error resolving JIRA ticket:", error)
    return NextResponse.json({ error: "Failed to resolve ticket" }, { status: 500 })
  }
}
