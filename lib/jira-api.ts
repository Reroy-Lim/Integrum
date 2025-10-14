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

      console.log("[v0] Jira API: Fetching tickets for user:", userEmail)
      console.log("[v0] Jira API: Is master account:", isMasterAccount)
      console.log("[v0] Jira API: Base URL:", this.config.baseUrl)
      console.log("[v0] Jira API: Project Key:", this.config.projectKey)

      const jql = `project = "${this.config.projectKey}" ORDER BY updated DESC`
      const params = new URLSearchParams({
        jql,
        maxResults: "100",
        fields: "summary,status,created,updated,assignee,reporter,description,priority,issuetype",
      })

      // Ensure baseUrl doesn't have trailing slash
      const baseUrl = this.config.baseUrl.replace(/\/$/, "")
      const requestUrl = `${baseUrl}/rest/api/3/search/jql?${params.toString()}`
      console.log("[v0] Jira API: Request URL:", requestUrl)

      const response = await fetch(requestUrl, {
        method: "GET",
        headers: this.getAuthHeaders(),
      })

      console.log("[v0] Jira API: Response status:", response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Jira API: Error response body:", errorText)
        throw new Error(`Failed to fetch tickets: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("[v0] Jira API: Total tickets fetched:", data.issues?.length || 0)

      if (data.issues && data.issues.length > 0) {
        console.log("[v0] Jira API: First ticket sample:", {
          key: data.issues[0].key,
          summary: data.issues[0].fields.summary,
          descriptionType: typeof data.issues[0].fields.description,
        })
      }

      const allTickets = data.issues.map((issue: any) => this.transformJiraIssue(issue))

      // If master account, return all tickets
      if (isMasterAccount) {
        console.log("[v0] Jira API: Master account - returning all", allTickets.length, "tickets")
        return allTickets
      }

      // For other users, filter by "From: [email]" in description
      console.log("[v0] Jira API: Filtering tickets for non-master account:", userEmail)
      const filteredTickets = allTickets.filter((ticket) => {
        const description = ticket.description || ""
        console.log("[v0] Jira API: Ticket", ticket.key, "description length:", description.length)
        console.log("[v0] Jira API: Ticket", ticket.key, "description preview:", description.substring(0, 200))

        const fromMatch = description.match(/From:\s*([^\s\n]+@[^\s\n]+)/i)
        const ticketOwnerEmail = fromMatch ? fromMatch[1].toLowerCase() : null

        console.log("[v0] Jira API: Ticket", ticket.key, "owner email:", ticketOwnerEmail)
        console.log("[v0] Jira API: Ticket", ticket.key, "matches user:", ticketOwnerEmail === userEmail.toLowerCase())

        return ticketOwnerEmail === userEmail.toLowerCase()
      })

      console.log("[v0] Jira API: Filtered tickets for", userEmail, ":", filteredTickets.length)
      console.log("[v0] Jira API: Filtered ticket keys:", filteredTickets.map((t) => t.key).join(", "))
      return filteredTickets
    } catch (error) {
      console.error("[v0] Jira API: Error fetching tickets:", error)
      if (error instanceof Error) {
        console.error("[v0] Jira API: Error message:", error.message)
        console.error("[v0] Jira API: Error stack:", error.stack)
      }
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
        console.log("[v0] Jira API: Extracted description from ADF for", issue.key, "length:", description.length)
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

    const result = extractText(adf).trim()
    console.log("[v0] Jira API: Extracted full text from ADF, length:", result.length)
    console.log("[v0] Jira API: First 300 chars:", result.substring(0, 300))
    return result
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
