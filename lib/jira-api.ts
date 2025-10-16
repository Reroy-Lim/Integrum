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
  attachments?: Array<{
    id: string
    filename: string
    size: number
    mimeType: string
    content: string
  }>
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

      const jql = `project = "${this.config.projectKey}" ORDER BY updated DESC`
      const params = new URLSearchParams({
        jql,
        maxResults: maxResults.toString(),
        fields: "summary,status,created,updated,assignee,reporter,description,priority,issuetype,attachment",
      })

      const baseUrl = this.config.baseUrl.replace(/\/$/, "")
      const requestUrl = `${baseUrl}/rest/api/3/search/jql?${params.toString()}`

      const response = await fetch(requestUrl, {
        method: "GET",
        headers: this.getAuthHeaders(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Jira API: Error response:", errorText)
        throw new Error(`Failed to fetch tickets: ${response.statusText}`)
      }

      const data = await response.json()
      const allTickets = data.issues.map((issue: any) => this.transformJiraIssue(issue))

      if (isMasterAccount) {
        return allTickets
      }

      const filteredTickets = allTickets.filter((ticket) => {
        const description = ticket.description || ""

        const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,6})(?=[A-Z]|\s|$|[^a-zA-Z0-9])/

        const patterns = [
          { name: "From: email", regex: new RegExp(`From:\\s*${emailPattern.source}`) },
          { name: "from: email", regex: new RegExp(`from:\\s*${emailPattern.source}`) },
          { name: "FROM: email", regex: new RegExp(`FROM:\\s*${emailPattern.source}`) },
          { name: "From: <email>", regex: new RegExp(`From:\\s*<${emailPattern.source}>`) },
          { name: "from: <email>", regex: new RegExp(`from:\\s*<${emailPattern.source}>`) },
          { name: "From:\\n email", regex: new RegExp(`From:\\s*\\n\\s*${emailPattern.source}`) },
          { name: "From : email", regex: new RegExp(`From\\s*:\\s*${emailPattern.source}`) },
        ]

        let ticketOwnerEmail: string | null = null

        for (const pattern of patterns) {
          const match = description.match(pattern.regex)
          if (match && match[1]) {
            ticketOwnerEmail = match[1].trim().toLowerCase()
            break
          }
        }

        if (!ticketOwnerEmail && description.toLowerCase().includes(userEmail.toLowerCase())) {
          ticketOwnerEmail = userEmail.toLowerCase()
        }

        return ticketOwnerEmail === userEmail.toLowerCase()
      })

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
        fields: "summary,status,created,updated,assignee,reporter,description,priority,issuetype,attachment",
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
        description = this.extractTextFromADF(issue.fields.description)
      }
    }

    const attachments = issue.fields.attachment
      ? issue.fields.attachment.map((att: any) => ({
          id: att.id,
          filename: att.filename,
          size: att.size,
          mimeType: att.mimeType,
          content: att.content,
        }))
      : []

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
      attachments: attachments.length > 0 ? attachments : undefined,
    }
  }

  private extractTextFromADF(adf: any): string {
    const extractText = (node: any): string => {
      if (!node) return ""

      if (node.type === "text" && node.text) {
        return node.text
      }

      if (node.type === "paragraph" || node.type === "heading") {
        let text = ""
        if (node.content && Array.isArray(node.content)) {
          for (const child of node.content) {
            text += extractText(child)
          }
        }
        return text + "\n"
      }

      if (node.content && Array.isArray(node.content)) {
        let text = ""
        for (const child of node.content) {
          text += extractText(child)
        }
        return text
      }

      return ""
    }

    return extractText(adf).trim()
  }

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
