import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const JIRA_BASE_URL = process.env.JIRA_BASE_URL
const JIRA_EMAIL = process.env.JIRA_EMAIL
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] ===== BULK RESOLVE STARTED =====")

    if (!JIRA_BASE_URL || !JIRA_EMAIL || !JIRA_API_TOKEN || !JIRA_PROJECT_KEY) {
      console.error("[v0] ❌ Missing Jira environment variables")
      return NextResponse.json({ error: "Server configuration error: Missing Jira credentials" }, { status: 500 })
    }

    if (!supabaseUrl || !supabaseKey) {
      console.error("[v0] ❌ Missing Supabase environment variables")
      return NextResponse.json({ error: "Server configuration error: Missing Supabase credentials" }, { status: 500 })
    }
    // </CHANGE>

    console.log("[v0] Bulk resolve: Parsing request body")

    let body
    try {
      body = await request.json()
      console.log("[v0] Bulk resolve: Request body parsed successfully")
    } catch (parseError) {
      console.error("[v0] ❌ Failed to parse request body:", parseError)
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }
    // </CHANGE>

    const { userEmail } = body
    console.log("[v0] Bulk resolve: User email:", userEmail)

    const masterEmail = process.env.NEXT_PUBLIC_MASTER_EMAIL || "heyroy23415@gmail.com"
    console.log("[v0] Bulk resolve: Master email:", masterEmail)

    if (userEmail !== masterEmail) {
      console.log("[v0] ❌ Bulk resolve: Unauthorized access attempt from:", userEmail)
      return NextResponse.json(
        { error: "Unauthorized: Only master account can perform bulk operations" },
        { status: 403 },
      )
    }

    console.log("[v0] ✅ Bulk resolve: Authorization successful")

    let supabase
    try {
      supabase = createClient(supabaseUrl, supabaseKey)
      console.log("[v0] ✅ Supabase client created successfully")
    } catch (supabaseError) {
      console.error("[v0] ❌ Failed to create Supabase client:", supabaseError)
      return NextResponse.json({ error: "Database connection error" }, { status: 500 })
    }
    // </CHANGE>

    // Fetch all tickets from Jira
    const jiraAuth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64")
    const jqlQuery = `project=${JIRA_PROJECT_KEY}`

    console.log("[v0] Bulk resolve: Fetching all tickets from Jira")
    console.log("[v0] Bulk resolve: JQL Query:", jqlQuery)

    const searchResponse = await fetch(
      `${JIRA_BASE_URL}/rest/api/3/search?jql=${encodeURIComponent(jqlQuery)}&maxResults=1000`,
      {
        headers: {
          Authorization: `Basic ${jiraAuth}`,
          "Content-Type": "application/json",
        },
      },
    )

    console.log("[v0] Bulk resolve: Jira search response status:", searchResponse.status)

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text()
      console.error("[v0] ❌ Jira search failed:", errorText)
      throw new Error(`Failed to fetch tickets: ${searchResponse.statusText}`)
    }

    const searchData = await searchResponse.json()
    const tickets = searchData.issues || []

    console.log(`[v0] ✅ Bulk resolve: Found ${tickets.length} tickets to process`)

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

      console.log(`[v0] 🎫 Processing ${ticketKey} (current status: ${currentStatus})`)

      try {
        // Skip if already done
        if (currentStatus.toLowerCase() === "done") {
          console.log(`[v0] ⏭️  ${ticketKey} already done, skipping`)
          results.successful++

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
            console.error(`[v0] ⚠️  ${ticketKey} Supabase update failed:`, supabaseError.message)
          } else {
            console.log(`[v0] ✅ ${ticketKey} Supabase category updated to Resolved`)
          }
          // </CHANGE>

          continue
        }

        // Update Jira status to Done
        console.log(`[v0] 🔄 ${ticketKey} Fetching available transitions`)
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
        console.log(
          `[v0] 📋 ${ticketKey} Available transitions:`,
          transitionData.transitions.map((t: any) => t.name).join(", "),
        )

        const doneTransition = transitionData.transitions.find(
          (t: any) => t.name.toLowerCase() === "done" || t.to.name.toLowerCase() === "done",
        )

        if (doneTransition) {
          console.log(`[v0] ✅ ${ticketKey} Found 'Done' transition (ID: ${doneTransition.id})`)

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
            const errorText = await updateResponse.text()
            console.error(`[v0] ❌ ${ticketKey} Transition failed:`, errorText)
            throw new Error(`Failed to transition ${ticketKey} to Done`)
          }

          console.log(`[v0] ✅ ${ticketKey} Jira status updated to Done`)
        } else {
          console.log(`[v0] ⚠️  ${ticketKey} No 'Done' transition available, skipping Jira update`)
        }

        // Update Supabase category to Resolved
        console.log(`[v0] 💾 ${ticketKey} Updating Supabase category to Resolved`)
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

        console.log(`[v0] ✅ ${ticketKey} Supabase category updated to Resolved`)
        results.successful++
      } catch (error) {
        console.error(`[v0] ❌ Error processing ${ticketKey}:`, error)
        results.failed++
        results.errors.push(`${ticketKey}: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    }

    console.log(`[v0] ===== BULK RESOLVE COMPLETED =====`)
    console.log(`[v0] 📊 Results: ${results.successful} successful, ${results.failed} failed`)
    if (results.errors.length > 0) {
      console.log(`[v0] ❌ Errors:`, results.errors)
    }

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error("[v0] ❌❌❌ BULK RESOLVE FATAL ERROR:", error)
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json(
      {
        error: "Failed to perform bulk resolve",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
