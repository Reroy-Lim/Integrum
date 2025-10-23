import { type NextRequest, NextResponse } from "next/server"
import { getJiraTickets, updateJiraTicketStatus } from "@/lib/jira-api"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] ===== BULK RESOLVE OPERATION STARTED =====")

    // Get user email from request
    const { userEmail } = await request.json()

    if (!userEmail) {
      return NextResponse.json({ error: "User email is required" }, { status: 400 })
    }

    // Check if user is master account
    const isMasterAccount = userEmail === process.env.NEXT_PUBLIC_MASTER_EMAIL || userEmail === "heyroy23415@gmail.com"

    if (!isMasterAccount) {
      console.log("[v0] ❌ Unauthorized: User is not master account")
      return NextResponse.json(
        { error: "Unauthorized: Only master account can perform bulk operations" },
        { status: 403 },
      )
    }

    console.log("[v0] ✅ Master account verified, proceeding with bulk resolve")

    // Fetch all tickets
    console.log("[v0] Fetching all tickets from Jira...")
    const allTickets = await getJiraTickets(userEmail, 1000)
    console.log("[v0] Total tickets fetched:", allTickets.length)

    // Initialize Supabase client
    const supabase = await createClient()

    // Fetch current ticket categories from Supabase
    const { data: categoriesData, error: categoriesError } = await supabase
      .from("ticket_categories")
      .select("ticket_key, category")

    if (categoriesError) {
      console.error("[v0] ❌ Error fetching categories:", categoriesError)
    }

    const ticketCategories: Record<string, string> = {}
    categoriesData?.forEach((item) => {
      ticketCategories[item.ticket_key] = item.category
    })

    console.log("[v0] Loaded", Object.keys(ticketCategories).length, "category overrides from Supabase")

    // Helper function to map Jira status to category
    const mapStatusToCategory = (status: string): string => {
      if (!status || typeof status !== "string") {
        return "In Progress"
      }

      const statusLower = status.toLowerCase()

      if (statusLower.includes("progress") || statusLower.includes("development") || statusLower.includes("review")) {
        return "In Progress"
      }

      if (statusLower.includes("done") || statusLower.includes("resolved") || statusLower.includes("closed")) {
        return "Resolved"
      }

      if (statusLower.includes("waiting") || statusLower.includes("pending") || statusLower.includes("feedback")) {
        return "Pending Reply"
      }

      return "In Progress"
    }

    // Filter tickets that are in "Pending Reply" status
    const pendingReplyTickets = allTickets.filter((ticket) => {
      const frontendCategory = ticketCategories[ticket.key]
      const jiraStatus = ticket.status.name
      const mappedCategory = frontendCategory || mapStatusToCategory(jiraStatus)

      return mappedCategory === "Pending Reply"
    })

    console.log("[v0] Found", pendingReplyTickets.length, "tickets in 'Pending Reply' status")

    if (pendingReplyTickets.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No tickets found in 'Pending Reply' status",
        resolved: 0,
        failed: 0,
      })
    }

    // Process each ticket
    const results = {
      resolved: 0,
      failed: 0,
      errors: [] as string[],
    }

    for (const ticket of pendingReplyTickets) {
      try {
        console.log(`[v0] Processing ticket ${ticket.key}...`)

        // Update Jira status to "Done"
        console.log(`[v0] Updating Jira status for ${ticket.key} to "Done"...`)
        await updateJiraTicketStatus(ticket.key, "Done")
        console.log(`[v0] ✅ Jira status updated for ${ticket.key}`)

        // Update Supabase category to "Resolved"
        console.log(`[v0] Updating Supabase category for ${ticket.key} to "Resolved"...`)
        const { error: upsertError } = await supabase.from("ticket_categories").upsert(
          {
            ticket_key: ticket.key,
            category: "Resolved",
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "ticket_key",
          },
        )

        if (upsertError) {
          console.error(`[v0] ❌ Error updating Supabase for ${ticket.key}:`, upsertError)
          results.failed++
          results.errors.push(`${ticket.key}: ${upsertError.message}`)
        } else {
          console.log(`[v0] ✅ Supabase category updated for ${ticket.key}`)
          results.resolved++
        }
      } catch (error) {
        console.error(`[v0] ❌ Error processing ticket ${ticket.key}:`, error)
        results.failed++
        results.errors.push(`${ticket.key}: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    }

    console.log("[v0] ===== BULK RESOLVE OPERATION COMPLETED =====")
    console.log("[v0] Results:", results)

    return NextResponse.json({
      success: true,
      message: `Bulk resolve completed: ${results.resolved} tickets resolved, ${results.failed} failed`,
      resolved: results.resolved,
      failed: results.failed,
      errors: results.errors,
    })
  } catch (error) {
    console.error("[v0] ❌ Bulk resolve operation failed:", error)
    return NextResponse.json(
      {
        error: "Bulk resolve operation failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
