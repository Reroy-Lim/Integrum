import { createClient } from "@supabase/supabase-js"

const JIRA_BASE_URL = process.env.JIRA_BASE_URL
const JIRA_EMAIL = process.env.JIRA_EMAIL
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Jira API authentication
const jiraAuth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64")

async function fetchAllJiraTickets() {
  console.log("[v0] Fetching all Jira tickets...")

  const response = await fetch(`${JIRA_BASE_URL}/rest/api/3/search?jql=project=${JIRA_PROJECT_KEY}&maxResults=1000`, {
    headers: {
      Authorization: `Basic ${jiraAuth}`,
      Accept: "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch tickets: ${response.statusText}`)
  }

  const data = await response.json()
  console.log(`[v0] Found ${data.issues.length} tickets`)
  return data.issues
}

async function updateJiraTicketStatus(ticketKey) {
  console.log(`[v0] Updating Jira status for ${ticketKey} to Done...`)

  // First, get available transitions for the ticket
  const transitionsResponse = await fetch(`${JIRA_BASE_URL}/rest/api/3/issue/${ticketKey}/transitions`, {
    headers: {
      Authorization: `Basic ${jiraAuth}`,
      Accept: "application/json",
    },
  })

  if (!transitionsResponse.ok) {
    throw new Error(`Failed to get transitions for ${ticketKey}: ${transitionsResponse.statusText}`)
  }

  const transitionsData = await transitionsResponse.json()

  // Find the "Done" transition
  const doneTransition = transitionsData.transitions.find(
    (t) => t.name.toLowerCase() === "done" || t.to.name.toLowerCase() === "done",
  )

  if (!doneTransition) {
    console.log(`[v0] No "Done" transition available for ${ticketKey}, skipping...`)
    return false
  }

  // Execute the transition
  const updateResponse = await fetch(`${JIRA_BASE_URL}/rest/api/3/issue/${ticketKey}/transitions`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${jiraAuth}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      transition: {
        id: doneTransition.id,
      },
    }),
  })

  if (!updateResponse.ok) {
    throw new Error(`Failed to update ${ticketKey}: ${updateResponse.statusText}`)
  }

  console.log(`[v0] ✓ Jira status updated for ${ticketKey}`)
  return true
}

async function updateSupabaseCategory(ticketKey) {
  console.log(`[v0] Updating Supabase category for ${ticketKey} to Resolved...`)

  const { error } = await supabase.from("ticket_categories").upsert(
    {
      ticket_key: ticketKey,
      category: "Resolved",
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "ticket_key",
    },
  )

  if (error) {
    throw new Error(`Failed to update Supabase for ${ticketKey}: ${error.message}`)
  }

  console.log(`[v0] ✓ Supabase category updated for ${ticketKey}`)
}

async function bulkResolveAllTickets() {
  console.log("[v0] Starting bulk resolve operation...")
  console.log("[v0] This will resolve ALL tickets in the project!")

  try {
    // Fetch all tickets
    const tickets = await fetchAllJiraTickets()

    if (tickets.length === 0) {
      console.log("[v0] No tickets found to resolve")
      return
    }

    console.log(`[v0] Processing ${tickets.length} tickets...`)

    let successCount = 0
    let failCount = 0

    // Process each ticket
    for (const ticket of tickets) {
      const ticketKey = ticket.key

      try {
        console.log(`\n[v0] Processing ${ticketKey}...`)

        // Update Jira status
        const jiraUpdated = await updateJiraTicketStatus(ticketKey)

        if (jiraUpdated) {
          // Update Supabase category
          await updateSupabaseCategory(ticketKey)
          successCount++
          console.log(`[v0] ✓ ${ticketKey} resolved successfully`)
        } else {
          failCount++
          console.log(`[v0] ✗ ${ticketKey} could not be resolved (no Done transition)`)
        }

        // Add a small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500))
      } catch (error) {
        failCount++
        console.error(`[v0] ✗ Error processing ${ticketKey}:`, error.message)
      }
    }

    console.log("\n[v0] ========================================")
    console.log("[v0] Bulk resolve operation completed!")
    console.log(`[v0] Total tickets: ${tickets.length}`)
    console.log(`[v0] Successfully resolved: ${successCount}`)
    console.log(`[v0] Failed: ${failCount}`)
    console.log("[v0] ========================================")
  } catch (error) {
    console.error("[v0] Fatal error during bulk resolve:", error)
    throw error
  }
}

// Run the script
bulkResolveAllTickets()
  .then(() => {
    console.log("[v0] Script completed successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.error("[v0] Script failed:", error)
    process.exit(1)
  })
