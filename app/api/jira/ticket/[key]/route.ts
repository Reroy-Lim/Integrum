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
    const success = await jiraClient.transitionTicket(ticketKey, "Done")

    if (!success) {
      console.error("[v0] ❌ Failed to update Jira status")
      return NextResponse.json({ error: "Failed to resolve ticket" }, { status: 500 })
    }

    console.log("[v0] ✅ Jira status updated to Done")

    try {
      console.log("[v0] Updating Supabase ticket_categories table...")
      const supabase = createClient()

      const { data, error } = await supabase
        .from("ticket_categories")
        .upsert(
          {
            ticket_key: ticketKey,
            category: "Resolved",
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "ticket_key",
          },
        )
        .select()

      if (error) {
        console.error("[v0] ❌ Error updating ticket_categories:", error)
        console.error("[v0] Error details:", JSON.stringify(error, null, 2))
        // Don't fail the request if Supabase update fails, Jira is the source of truth
      } else {
        console.log("[v0] ✅ Successfully updated ticket_categories to 'Resolved'")
        console.log("[v0] Updated data:", data)
      }
    } catch (supabaseError) {
      console.error("[v0] ❌ Exception updating Supabase:", supabaseError)
      // Don't fail the request if Supabase update fails
    }

    console.log("[v0] ===== TICKET RESOLUTION COMPLETE =====")
    return NextResponse.json({ success: true, message: "Ticket resolved successfully" })
  } catch (error) {
    console.error("[v0] ❌ Error resolving JIRA ticket:", error)
    return NextResponse.json({ error: "Failed to resolve ticket" }, { status: 500 })
  }
}
