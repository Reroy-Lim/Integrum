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

    console.log("[v0] ===== RESOLVE TICKET API START =====")
    console.log("[v0] Ticket key:", ticketKey)
    console.log("[v0] Action:", action)
    console.log("[v0] Timestamp:", new Date().toISOString())

    const jiraConfig = {
      baseUrl: process.env.JIRA_BASE_URL || "",
      email: process.env.JIRA_EMAIL || "",
      apiToken: process.env.JIRA_API_TOKEN || "",
      projectKey: process.env.JIRA_PROJECT_KEY || "HELP",
    }

    const jiraClient = new JiraApiClient(jiraConfig)

    console.log("[v0] Step 1: Transitioning Jira ticket to Done...")
    const success = await jiraClient.transitionTicket(ticketKey, "Done")

    if (!success) {
      console.error("[v0] ❌ Failed to transition Jira ticket to Done")
      return NextResponse.json({ error: "Failed to resolve ticket in Jira" }, { status: 500 })
    }
    console.log("[v0] ✅ Jira ticket transitioned to Done successfully")

    try {
      console.log("[v0] Step 2: Updating frontend category to Resolved in Supabase...")
      const supabase = await createClient()

      // First, check if the record exists
      const { data: existingData, error: selectError } = await supabase
        .from("ticket_categories")
        .select("*")
        .eq("ticket_key", ticketKey)
        .single()

      if (selectError && selectError.code !== "PGRST116") {
        // PGRST116 is "not found" error, which is okay
        console.error("[v0] ⚠️ Error checking existing category:", selectError)
      } else if (existingData) {
        console.log("[v0] Found existing category record:", existingData)
      } else {
        console.log("[v0] No existing category record found, will create new one")
      }

      // Upsert the category
      const { data: upsertData, error: updateError } = await supabase
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

      if (updateError) {
        console.error("[v0] ❌ Error updating frontend category:", updateError)
        console.error("[v0] Error code:", updateError.code)
        console.error("[v0] Error message:", updateError.message)
        console.error("[v0] Error details:", JSON.stringify(updateError, null, 2))
        // Don't fail the request, but log the error
      } else {
        console.log("[v0] ✅ Successfully updated frontend category to Resolved")
        console.log("[v0] Upsert result:", JSON.stringify(upsertData, null, 2))

        // Verify the update
        const { data: verifyData, error: verifyError } = await supabase
          .from("ticket_categories")
          .select("*")
          .eq("ticket_key", ticketKey)
          .single()

        if (verifyError) {
          console.error("[v0] ⚠️ Error verifying category update:", verifyError)
        } else {
          console.log("[v0] ✅ Verified category update:", verifyData)
        }
      }
    } catch (error) {
      console.error("[v0] ❌ Exception during frontend category update:", error)
      console.error("[v0] Error type:", error instanceof Error ? error.constructor.name : typeof error)
      console.error("[v0] Error message:", error instanceof Error ? error.message : String(error))
      console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")
      // Don't fail the request if category update fails
    }
    // </CHANGE>

    console.log("[v0] ===== RESOLVE TICKET API END =====")

    return NextResponse.json({ success: true, message: "Ticket resolved successfully", ticketKey })
  } catch (error) {
    console.error("[v0] ❌ Error resolving JIRA ticket:", error)
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json({ error: "Failed to resolve ticket" }, { status: 500 })
  }
}
