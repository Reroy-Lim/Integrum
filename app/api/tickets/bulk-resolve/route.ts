import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const JIRA_BASE_URL = process.env.JIRA_BASE_URL
const JIRA_EMAIL = process.env.JIRA_EMAIL
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Bulk resolve: Starting bulk ticket resolution")

    // Verify master account
    const { userEmail } = await request.json()
    const masterEmail = process.env.NEXT_PUBLIC_MASTER_EMAIL || "heyroy23415@gmail.com"

    if (userEmail !== masterEmail) {
      console.log("[v0] Bulk resolve: Unauthorized access attempt")
      return NextResponse.json(
        { error: "Unauthorized: Only master account can perform bulk operations" },
        { status: 403 },
      )
    }

    // Fetch all tickets from Jira
    const jiraAuth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64")
    const jqlQuery = `project=${JIRA_PROJECT_KEY}`

    console.log("[v0] Bulk resolve: Fetching all tickets from Jira")
    const searchResponse = await fetch(
      `${JIRA_BASE_URL}/rest/api/3/search?jql=${encodeURIComponent(jqlQuery)}&maxResults=1000`,
      {
        headers: {
          Authorization: `Basic ${jiraAuth}`,
          "Content-Type": "application/json",
        },
      },
    )

    if (!searchResponse.ok) {
      throw new Error(`Failed to fetch tickets: ${searchResponse.statusText}`)
    }

    const searchData = await searchResponse.json()
    const tickets = searchData.issues || []

    console.log(`[v0] Bulk resolve: Found ${tickets.length} tickets to resolve`)

    const results = {
      total: tickets.length,
      successful: 0,
      failed: 0,
      errors: [] as string[],
    }

    // Process each ticket
    for (const ticket of tickets) {
      const ticketKey = ticket.key
      const currentStatus = ticket.fields.status.name

      console.log(`[v0] Bulk resolve: Processing ${ticketKey} (current status: ${currentStatus})`)

      try {
        // Skip if already done
        if (currentStatus.toLowerCase() === "done") {
          console.log(`[v0] Bulk resolve: ${ticketKey} already done, skipping`)
          results.successful++
          continue
        }

        // Update Jira status to Done
        const transitionResponse = await fetch(`${JIRA_BASE_URL}/rest/api/3/issue/${ticketKey}/transitions`, {
          method: "GET",
          headers: {
            Authorization: `Basic ${jiraAuth}`,
            "Content-Type": "application/json",
          },
        })

        if (!transitionResponse.ok) {
          throw new Error(`Failed to get transitions for ${ticketKey}`)
        }

        const transitionData = await transitionResponse.json()
        const doneTransition = transitionData.transitions.find(
          (t: any) => t.name.toLowerCase() === "done" || t.to.name.toLowerCase() === "done",
        )

        if (doneTransition) {
          // Perform transition to Done
          const updateResponse = await fetch(`${JIRA_BASE_URL}/rest/api/3/issue/${ticketKey}/transitions`, {
            method: "POST",
            headers: {
              Authorization: `Basic ${jiraAuth}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              transition: {
                id: doneTransition.id,
              },
            }),
          })

          if (!updateResponse.ok) {
            throw new Error(`Failed to transition ${ticketKey} to Done`)
          }

          console.log(`[v0] Bulk resolve: ${ticketKey} Jira status updated to Done`)
        } else {
          console.log(`[v0] Bulk resolve: ${ticketKey} No 'Done' transition available, skipping Jira update`)
        }

        // Update Supabase category to Resolved
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
          throw new Error(`Failed to update Supabase for ${ticketKey}: ${supabaseError.message}`)
        }

        console.log(`[v0] Bulk resolve: ${ticketKey} Supabase category updated to Resolved`)
        results.successful++
      } catch (error) {
        console.error(`[v0] Bulk resolve: Error processing ${ticketKey}:`, error)
        results.failed++
        results.errors.push(`${ticketKey}: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    }

    console.log(`[v0] Bulk resolve: Completed - ${results.successful} successful, ${results.failed} failed`)

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error("[v0] Bulk resolve: Fatal error:", error)
    return NextResponse.json(
      {
        error: "Failed to perform bulk resolve",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
