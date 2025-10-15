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
      const maxResults = 100 // Jira's maximum per request
      let total = 0

      // Fetch tickets in batches until we have all of them
      do {
        const params = new URLSearchParams({
          jql,
          startAt: startAt.toString(),
          maxResults: maxResults.toString(),
          fields: "summary,status,created,updated,assignee,reporter,description,priority,issuetype",
        })

        const requestUrl = `${baseUrl}/rest/api/3/search/jql?${params.toString()}`
        console.log(`[v0] Jira API: Fetching batch starting at ${startAt}`)

        const response = await fetch(requestUrl, {
          method: "GET",
          headers: this.getAuthHeaders(),
        })

        console.log("[v0] Jira API: Response status:", response.status)

        if (!response.ok) {
          const errorText = await response.text()
          console.error("[v0] Jira API: Error response:", errorText)
          throw new Error(`Failed to fetch tickets: ${response.statusText}`)
        }

        const data = await response.json()
        total = data.total
        const batchTickets = data.issues.map((issue: any) => this.transformJiraIssue(issue))

        allTickets = allTickets.concat(batchTickets)
        startAt += maxResults

        console.log(`[v0] Jira API: Fetched ${batchTickets.length} tickets (${allTickets.length}/${total} total)`)

        // Continue if there are more tickets to fetch
      } while (startAt < total)

      console.log("[v0] Jira API: Total tickets fetched:", allTickets.length, "out of", total)

      // If master account, return all tickets
      if (isMasterAccount) {
        console.log("[v0] Jira API: Master account - returning all tickets")
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
