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

      // Fetch all tickets from the project
      const jql = `project = "${this.config.projectKey}" ORDER BY updated DESC`
      const response = await fetch(`${this.config.baseUrl}/rest/api/3/search`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          jql,
          maxResults: 100,
          fields: [
            "summary",
            "status",
            "created",
            "updated",
            "assignee",
            "reporter",
            "description",
            "priority",
            "issuetype",
          ],
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch tickets: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("[v0] Jira API: Total tickets fetched:", data.issues.length)

      const allTickets = data.issues.map((issue: any) => this.transformJiraIssue(issue))

      // If master account, return all tickets
      if (isMasterAccount) {
        console.log("[v0] Jira API: Master account - returning all tickets")
        return allTickets
      }

      // For other users, filter by "From: [email]" in description
      const filteredTickets = allTickets.filter((ticket) => {
        const description = ticket.description || ""
        const fromMatch = description.match(/From:\s*([^\s\n]+@[^\s\n]+)/i)
        const ticketOwnerEmail = fromMatch ? fromMatch[1].toLowerCase() : null

        console.log("[v0] Jira API: Ticket", ticket.key, "owner email:", ticketOwnerEmail)

        return ticketOwnerEmail === userEmail.toLowerCase()
      })

      console.log("[v0] Jira API: Filtered tickets for", userEmail, ":", filteredTickets.length)
      return filteredTickets
    } catch (error) {
      console.error("Error fetching JIRA tickets:", error)
      return []
    }
  }

  async getLatestTicketByUser(userEmail: string): Promise<JiraTicket | null> {
    try {
      const jql = `reporter = "${userEmail}" OR assignee = "${userEmail}" ORDER BY updated DESC`
      const response = await fetch(`${this.config.baseUrl}/rest/api/3/search`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          jql,
          maxResults: 1, // Only get the latest ticket
          fields: [
            "summary",
            "status",
            "created",
            "updated",
            "assignee",
            "reporter",
            "description",
            "priority",
            "issuetype",
          ],
        }),
      })

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
    let text = ""

    if (adf.content && Array.isArray(adf.content)) {
      for (const node of adf.content) {
        if (node.type === "paragraph" && node.content) {
          for (const contentNode of node.content) {
            if (contentNode.type === "text" && contentNode.text) {
              text += contentNode.text + " "
            }
          }
          text += "\n"
        }
      }
    }

    return text.trim()
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
