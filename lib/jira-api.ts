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

  async getTicketsByUser(userEmail: string, maxResults = 100): Promise<JiraTicket[]> {
    try {
      const masterEmail = "heyroy23415@gmail.com"
      const isMasterAccount = userEmail.toLowerCase() === masterEmail.toLowerCase()

      console.log(
        "[v0] Jira API: Fetching tickets for user:",
        userEmail,
        "| Is master:",
        isMasterAccount,
        "| Limit:",
        maxResults,
      )

      const jql = `project = "${this.config.projectKey}" ORDER BY updated DESC`
      const params = new URLSearchParams({
        jql,
        maxResults: maxResults.toString(),
        fields: "summary,status,created,updated,assignee,reporter,description,priority,issuetype",
      })

      const baseUrl = this.config.baseUrl.replace(/\/$/, "")
      const requestUrl = `${baseUrl}/rest/api/3/search/jql?${params.toString()}`

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
      const allTickets = data.issues.map((issue: any) => this.transformJiraIssue(issue))

      console.log("[v0] Jira API: Total tickets fetched:", allTickets.length)

      // If master account, return all tickets
      if (isMasterAccount) {
        console.log("[v0] Jira API: Master account - returning all tickets")
        return allTickets
      }

      console.log("[v0] Jira API: Non-master account - filtering tickets for:", userEmail)

      const filteredTickets = allTickets.filter((ticket, index) => {
        const description = ticket.description || ""

        // Log first 3 tickets in detail
        if (index < 3) {
          console.log(`[v0] Jira API: Analyzing ticket ${ticket.key}:`)
          console.log(`[v0] Jira API: Description length: ${description.length}`)
          console.log(`[v0] Jira API: Description preview (first 300 chars):`, description.substring(0, 300))
        }

        // Try multiple patterns to extract email from "From:" field
        const patterns = [
          /From:\s*([^\s\n<>]+@[^\s\n<>]+)/i, // From: email
          /From:\s*<([^>]+@[^>]+)>/i, // From: <email>
          /From:\s*\n\s*([^\s\n<>]+@[^\s\n<>]+)/i, // From:\n email (newline)
          /From\s*:\s*([^\s\n<>]+@[^\s\n<>]+)/i, // From : email (space before colon)
          /from:\s*([^\s\n<>]+@[^\s\n<>]+)/i, // from: email (lowercase)
          /FROM:\s*([^\s\n<>]+@[^\s\n<>]+)/i, // FROM: email (uppercase)
        ]

        let ticketOwnerEmail: string | null = null
        let matchedPattern: string | null = null

        // Try each pattern
        for (let i = 0; i < patterns.length; i++) {
          const pattern = patterns[i]
          const match = description.match(pattern)
          if (match && match[1]) {
            ticketOwnerEmail = match[1].trim().toLowerCase()
            matchedPattern = `Pattern ${i + 1}`
            if (index < 3) {
              console.log(`[v0] Jira API: ${ticket.key} - Found email using ${matchedPattern}:`, ticketOwnerEmail)
            }
            break
          }
        }

        // Fallback: if no "From:" field found, check if description contains the user's email anywhere
        if (!ticketOwnerEmail && description.toLowerCase().includes(userEmail.toLowerCase())) {
          ticketOwnerEmail = userEmail.toLowerCase()
          matchedPattern = "Fallback (email found in description)"
          if (index < 3) {
            console.log(`[v0] Jira API: ${ticket.key} - Found email using fallback`)
          }
        }

        const matches = ticketOwnerEmail === userEmail.toLowerCase()

        if (index < 3) {
          console.log(`[v0] Jira API: ${ticket.key} - Extracted email:`, ticketOwnerEmail || "NONE")
          console.log(`[v0] Jira API: ${ticket.key} - Looking for:`, userEmail.toLowerCase())
          console.log(`[v0] Jira API: ${ticket.key} - Match:`, matches)
          console.log("---")
        }

        return matches
      })

      console.log("[v0] Jira API: Filtered", filteredTickets.length, "tickets for", userEmail)

      // If no matches, show more details
      if (filteredTickets.length === 0 && allTickets.length > 0) {
        console.log("[v0] Jira API: ⚠️ NO MATCHES FOUND - Showing full description of first ticket for debugging:")
        const firstTicket = allTickets[0]
        console.log(`[v0] Jira API: Ticket ${firstTicket.key} FULL DESCRIPTION:`)
        console.log(firstTicket.description || "No description")
        console.log("[v0] Jira API: End of description")
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
