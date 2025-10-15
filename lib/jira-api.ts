// JIRA API integration for fetching tickets
export interface JiraTicket {
  id: string
  key: string
  summary: string
  status: {
    name: string
    statusCategory: {
      name: string
    }
  }
  created: string
  updated: string
  assignee?: {
    displayName: string
    emailAddress: string
  }
  reporter: {
    displayName: string
    emailAddress: string
  }
  description?: string
  priority: {
    name: string
  }
  issuetype: {
    name: string
  }
}

export interface JiraConfig {
  baseUrl: string
  email: string
  apiToken: string
  projectKey: string
}

export class JiraApiClient {
  private config: JiraConfig

  constructor(config: JiraConfig) {
    this.config = config
  }

  private getAuthHeaders() {
    const auth = btoa(`${this.config.email}:${this.config.apiToken}`)
    return {
      Authorization: `Basic ${auth}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    }
  }

  async getTicket(ticketKey: string): Promise<JiraTicket | null> {
    try {
      const response = await fetch(`${this.config.baseUrl}/rest/api/3/issue/${ticketKey}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch ticket: ${response.statusText}`)
      }

      const data = await response.json()
      return this.transformJiraIssue(data)
    } catch (error) {
      console.error("Error fetching JIRA ticket:", error)
      return null
    }
  }

  async getTicketsByUser(userEmail: string): Promise<JiraTicket[]> {
    try {
      const masterEmail = "heyroy23415@gmail.com"
      const isMasterAccount = userEmail.toLowerCase() === masterEmail.toLowerCase()

      console.log("[v0] Jira API: Fetching tickets for user:", userEmail, "| Is master:", isMasterAccount)

      const jql = `project = "${this.config.projectKey}" ORDER BY updated DESC`
      const baseUrl = this.config.baseUrl.replace(/\/$/, "")

      let allTickets: JiraTicket[] = []
      let startAt = 0
      const maxResults = 100 // Fetch 100 tickets at a time (Jira's standard limit)
      let total = 0
      let requestCount = 0
      const maxRequests = 50 // Safety limit to prevent infinite loops

      console.log("[v0] Jira API: ═══════════════════════════════════════")
      console.log("[v0] Jira API: Starting pagination fetch")
      console.log("[v0] Jira API: Batch size: 100 tickets per request")
      console.log("[v0] Jira API: ═══════════════════════════════════════")

      do {
        requestCount++

        // ═══ DOUBLE-CHECK #1: Pre-fetch validation ═══
        console.log(`\n[v0] Jira API: ┌─ BATCH #${requestCount} PRE-FETCH CHECK ─┐`)
        console.log(`[v0] Jira API: │ Current progress: ${allTickets.length}/${total || "unknown"} tickets`)
        console.log(`[v0] Jira API: │ Next fetch: startAt=${startAt}, maxResults=${maxResults}`)
        console.log(`[v0] Jira API: │ Expected range: tickets ${startAt + 1} to ${startAt + maxResults}`)

        if (requestCount > maxRequests) {
          console.error(`[v0] Jira API: │ ✗ SAFETY LIMIT REACHED (${maxRequests} requests)`)
          console.log(`[v0] Jira API: └────────────────────────────────────┘`)
          break
        }

        if (total > 0 && startAt >= total) {
          console.log(`[v0] Jira API: │ ✓ All tickets fetched (startAt=${startAt} >= total=${total})`)
          console.log(`[v0] Jira API: └────────────────────────────────────┘`)
          break
        }

        console.log(`[v0] Jira API: │ ✓ Validation passed, proceeding with fetch`)
        console.log(`[v0] Jira API: └────────────────────────────────────┘`)

        const params = new URLSearchParams({
          jql,
          startAt: startAt.toString(),
          maxResults: maxResults.toString(),
          fields: "summary,status,created,updated,assignee,reporter,description,priority,issuetype",
        })

        const requestUrl = `${baseUrl}/rest/api/3/search/jql?${params.toString()}`

        const response = await fetch(requestUrl, {
          method: "GET",
          headers: this.getAuthHeaders(),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error("[v0] Jira API: ✗ Request failed:", response.status, errorText)
          throw new Error(`Failed to fetch tickets: ${response.statusText}`)
        }

        const data = await response.json()

        // ═══ DOUBLE-CHECK #2: Post-fetch validation ═══
        console.log(`\n[v0] Jira API: ┌─ BATCH #${requestCount} POST-FETCH CHECK ─┐`)
        console.log(`[v0] Jira API: │ Response status: ${response.status} OK`)
        console.log(`[v0] Jira API: │ Total tickets in Jira: ${data.total || 0}`)
        console.log(`[v0] Jira API: │ Tickets in this batch: ${data.issues?.length || 0}`)
        console.log(`[v0] Jira API: │ Response startAt: ${data.startAt}`)
        console.log(`[v0] Jira API: │ Response maxResults: ${data.maxResults}`)

        // Validate response structure
        if (!data.issues || !Array.isArray(data.issues)) {
          console.error(`[v0] Jira API: │ ✗ Invalid response: 'issues' is not an array`)
          console.log(`[v0] Jira API: └────────────────────────────────────┘`)
          break
        }

        if (typeof data.total !== "number") {
          console.error(`[v0] Jira API: │ ✗ Invalid response: 'total' is not a number`)
          console.log(`[v0] Jira API: └────────────────────────────────────┘`)
          break
        }

        // Set total on first request
        if (requestCount === 1) {
          total = data.total
          const estimatedRequests = Math.ceil(total / maxResults)
          console.log(`[v0] Jira API: │ ✓ Total tickets detected: ${total}`)
          console.log(`[v0] Jira API: │ ✓ Estimated requests needed: ${estimatedRequests}`)
          console.log(`[v0] Jira API: │   (${total} tickets ÷ ${maxResults} per batch = ${estimatedRequests} batches)`)
        }

        const batchTickets = data.issues.map((issue: any) => this.transformJiraIssue(issue))
        allTickets = allTickets.concat(batchTickets)

        console.log(`[v0] Jira API: │ ✓ Batch processed: ${batchTickets.length} tickets added`)
        console.log(`[v0] Jira API: │ ✓ Total collected: ${allTickets.length}/${total}`)
        console.log(`[v0] Jira API: │ ✓ Progress: ${Math.round((allTickets.length / total) * 100)}%`)

        startAt += batchTickets.length

        const shouldContinue = allTickets.length < total && batchTickets.length > 0
        console.log(`[v0] Jira API: │ Continue fetching? ${shouldContinue ? "YES" : "NO"}`)

        if (shouldContinue) {
          console.log(`[v0] Jira API: │   Reason: Still have ${total - allTickets.length} tickets to fetch`)
        } else if (allTickets.length >= total) {
          console.log(`[v0] Jira API: │   Reason: All tickets fetched (${allTickets.length}/${total})`)
        } else if (batchTickets.length === 0) {
          console.log(`[v0] Jira API: │   Reason: Last batch was empty`)
        }

        console.log(`[v0] Jira API: └────────────────────────────────────┘`)

        if (!shouldContinue) {
          break
        }
      } while (true)

      console.log("\n[v0] Jira API: ═══════════════════════════════════════")
      console.log(`[v0] Jira API: ✓ FETCH COMPLETE`)
      console.log(`[v0] Jira API: Total requests made: ${requestCount}`)
      console.log(`[v0] Jira API: Total tickets fetched: ${allTickets.length}`)
      console.log(`[v0] Jira API: Expected total: ${total}`)
      console.log(`[v0] Jira API: Match: ${allTickets.length === total ? "✓ YES" : "✗ NO"}`)
      console.log("[v0] Jira API: ═══════════════════════════════════════\n")

      // If master account, return all tickets
      if (isMasterAccount) {
        console.log("[v0] Jira API: Master account - returning all", allTickets.length, "tickets")
        return allTickets
      }

      const filteredTickets = allTickets.filter((ticket) => {
        const description = ticket.description || ""

        // Try multiple patterns to extract email
        const patterns = [
          /From:\s*([^\s\n<>]+@[^\s\n<>]+)/i, // From: email
          /from:\s*([^\s\n<>]+@[^\s\n<>]+)/i, // from: email (lowercase)
          /FROM:\s*([^\s\n<>]+@[^\s\n<>]+)/i, // FROM: email (uppercase)
        ]

        let ticketOwnerEmail: string | null = null

        for (const pattern of patterns) {
          const match = description.match(pattern)
          if (match && match[1]) {
            ticketOwnerEmail = match[1].trim().toLowerCase()
            break
          }
        }

        const matches = ticketOwnerEmail === userEmail.toLowerCase()

        // Debug logging for first few tickets
        if (allTickets.indexOf(ticket) < 3) {
          console.log(
            `[v0] Jira API: Ticket ${ticket.key} - Owner: ${ticketOwnerEmail || "none"} | User: ${userEmail} | Match: ${matches}`,
          )
        }

        return matches
      })

      console.log("[v0] Jira API: Filtered", filteredTickets.length, "tickets for", userEmail)

      // Log first ticket as sample for debugging
      if (filteredTickets.length > 0) {
        console.log("[v0] Jira API: Sample filtered ticket:", filteredTickets[0].key)
      } else if (allTickets.length > 0) {
        // If no matches, show sample of what we're looking for
        const sampleDesc = allTickets[0].description?.substring(0, 300) || "No description"
        console.log("[v0] Jira API: No matches found. Sample description:", sampleDesc)
      }

      return filteredTickets
    } catch (error) {
      console.error("[v0] Jira API: Error:", error instanceof Error ? error.message : "Unknown error")
      return []
    }
  }

  async getLatestTicketByUser(userEmail: string): Promise<JiraTicket | null> {
    try {
      const jql = `reporter = "${userEmail}" OR assignee = "${userEmail}" ORDER BY updated DESC`
      const params = new URLSearchParams({
        jql,
        maxResults: "1",
        fields: "summary,status,created,updated,assignee,reporter,description,priority,issuetype",
      })

      const baseUrl = this.config.baseUrl.replace(/\/$/, "")
      const response = await fetch(`${baseUrl}/rest/api/3/search/jql?${params.toString()}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      })

      console.log("[v0] Jira API: Response status:", response.status, response.statusText)

      if (!response.ok) {
        throw new Error(`Failed to fetch latest ticket: ${response.statusText}`)
      }

      const data = await response.json()
      return data.issues.length > 0 ? this.transformJiraIssue(data.issues[0]) : null
    } catch (error) {
      console.error("Error fetching latest JIRA ticket:", error)
      return null
    }
  }

  private transformJiraIssue(issue: any): JiraTicket {
    let description = ""

    if (issue.fields.description) {
      if (typeof issue.fields.description === "string") {
        description = issue.fields.description
      } else if (issue.fields.description.content) {
        // Handle Atlassian Document Format (ADF)
        description = this.extractTextFromADF(issue.fields.description)
      }
    }

    return {
      id: issue.id,
      key: issue.key,
      summary: issue.fields.summary,
      status: {
        name: issue.fields.status.name,
        statusCategory: {
          name: issue.fields.status.statusCategory.name,
        },
      },
      created: issue.fields.created,
      updated: issue.fields.updated,
      assignee: issue.fields.assignee
        ? {
            displayName: issue.fields.assignee.displayName,
            emailAddress: issue.fields.assignee.emailAddress,
          }
        : undefined,
      reporter: {
        displayName: issue.fields.reporter.displayName,
        emailAddress: issue.fields.reporter.emailAddress,
      },
      description,
      priority: {
        name: issue.fields.priority.name,
      },
      issuetype: {
        name: issue.fields.issuetype.name,
      },
    }
  }

  private extractTextFromADF(adf: any): string {
    const extractText = (node: any): string => {
      let text = ""

      // If node has text property, add it
      if (node.text) {
        text += node.text
      }

      // If node has content array, recursively process each child
      if (node.content && Array.isArray(node.content)) {
        for (const child of node.content) {
          text += extractText(child)

          // Add newline after paragraphs and headings
          if (child.type === "paragraph" || child.type === "heading") {
            text += "\n"
          }
        }
      }

      return text
    }

    return extractText(adf).trim()
  }

  // Map JIRA status to our categories
  mapStatusToCategory(status: string): string {
    const statusLower = status.toLowerCase()

    if (statusLower.includes("progress") || statusLower.includes("development") || statusLower.includes("review")) {
      return "In Progression"
    }

    if (statusLower.includes("done") || statusLower.includes("resolved") || statusLower.includes("closed")) {
      return "Resolved"
    }

    if (statusLower.includes("waiting") || statusLower.includes("pending") || statusLower.includes("feedback")) {
      return "Pending Reply"
    }

    return "In Progression" // Default
  }
}
