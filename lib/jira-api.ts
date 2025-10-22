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
      const params = new URLSearchParams({
        fields: "summary,status,created,updated,assignee,reporter,description,priority,issuetype,attachment",
      })

      const response = await fetch(`${this.config.baseUrl}/rest/api/3/issue/${ticketKey}?${params.toString()}`, {
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
        fields: "summary,status,created,updated,assignee,reporter,description,priority,issuetype,attachment",
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

      console.log("[v0] Jira API: Starting email filtering for non-master account:", userEmail)

      const filteredTickets = allTickets.filter((ticket, index) => {
        const description = ticket.description || ""

        // This ensures [a-z]{2,6} only matches lowercase letters, stopping at "Description"
        const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,6})(?=[A-Z]|\s|$|[^a-zA-Z0-9])/

        const patterns = [
          new RegExp(`From:\\s*${emailPattern.source}`), // From: email
          new RegExp(`from:\\s*${emailPattern.source}`), // from: email
          new RegExp(`FROM:\\s*${emailPattern.source}`), // FROM: email
          new RegExp(`From:\\s*<${emailPattern.source}>`), // From: <email>
          new RegExp(`from:\\s*<${emailPattern.source}>`), // from: <email>
          new RegExp(`From:\\s*\\n\\s*${emailPattern.source}`), // From:\n email
          new RegExp(`From\\s*:\\s*${emailPattern.source}`), // From : email
        ]

        let ticketOwnerEmail: string | null = null
        let matchedPattern = -1

        // Try each pattern
        for (let i = 0; i < patterns.length; i++) {
          const match = description.match(patterns[i])
          if (match && match[1]) {
            ticketOwnerEmail = match[1].trim().toLowerCase()
            matchedPattern = i
            break
          }
        }

        // Fallback: if no "From:" field found, check if description contains the user's email anywhere
        if (!ticketOwnerEmail && description.toLowerCase().includes(userEmail.toLowerCase())) {
          ticketOwnerEmail = userEmail.toLowerCase()
          matchedPattern = 999 // Fallback pattern
        }

        const matches = ticketOwnerEmail === userEmail.toLowerCase()

        // Log first 5 tickets in detail for debugging
        if (index < 5) {
          console.log(`[v0] Jira API: Ticket ${ticket.key}:`)
          console.log(`  - Extracted email: ${ticketOwnerEmail || "NONE"}`)
          console.log(`  - Pattern used: ${matchedPattern >= 0 ? matchedPattern : "none"}`)
          console.log(`  - Matches user: ${matches}`)
          console.log(`  - Description preview: ${description.substring(0, 150)}...`)
        }

        return matches
      })

      console.log("[v0] Jira API: Filtered", filteredTickets.length, "tickets for", userEmail)

      // If no matches, show more detailed debugging
      if (filteredTickets.length === 0 && allTickets.length > 0) {
        console.log("[v0] Jira API: ⚠️ NO MATCHES FOUND for user:", userEmail)
        console.log("[v0] Jira API: Showing full descriptions of first 2 tickets:")

        for (let i = 0; i < Math.min(2, allTickets.length); i++) {
          const ticket = allTickets[i]
          const desc = ticket.description || "No description"
          console.log(`\n[v0] Jira API: ===== Ticket ${ticket.key} FULL DESCRIPTION =====`)
          console.log(desc)
          console.log(`[v0] Jira API: ===== END ${ticket.key} =====\n`)
        }
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
        // Handle Atlassian Document Format (ADF)
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

      // If it's a text node, return the text directly
      if (node.type === "text" && node.text) {
        return node.text
      }

      // If it's a block-level node (paragraph, heading, etc.), process children and add newline
      if (node.type === "paragraph" || node.type === "heading") {
        let text = ""
        if (node.content && Array.isArray(node.content)) {
          for (const child of node.content) {
            text += extractText(child)
          }
        }
        return text + "\n" // Add newline after each paragraph/heading
      }

      // For other container nodes (doc, listItem, etc.), just process children
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

  async transitionTicketToDone(ticketKey: string): Promise<boolean> {
    try {
      // First, get available transitions for the ticket
      const transitionsResponse = await fetch(`${this.config.baseUrl}/rest/api/3/issue/${ticketKey}/transitions`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      })

      if (!transitionsResponse.ok) {
        throw new Error(`Failed to fetch transitions: ${transitionsResponse.statusText}`)
      }

      const transitionsData = await transitionsResponse.json()

      // Find the "Done" transition (case-insensitive)
      const doneTransition = transitionsData.transitions.find(
        (t: any) => t.name.toLowerCase() === "done" || t.to.name.toLowerCase() === "done",
      )

      if (!doneTransition) {
        console.error("[v0] Jira API: No 'Done' transition found for ticket", ticketKey)
        return false
      }

      // Perform the transition
      const transitionResponse = await fetch(`${this.config.baseUrl}/rest/api/3/issue/${ticketKey}/transitions`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          transition: {
            id: doneTransition.id,
          },
        }),
      })

      if (!transitionResponse.ok) {
        const errorText = await transitionResponse.text()
        console.error("[v0] Jira API: Failed to transition ticket:", errorText)
        return false
      }

      console.log("[v0] Jira API: Successfully transitioned ticket", ticketKey, "to Done")
      return true
    } catch (error) {
      console.error("[v0] Jira API: Error transitioning ticket:", error)
      return false
    }
  }
}

export async function getJiraTicket(ticketKey: string): Promise<JiraTicket | null> {
  const jiraConfig: JiraConfig = {
    baseUrl: process.env.JIRA_BASE_URL || "",
    email: process.env.JIRA_EMAIL || "",
    apiToken: process.env.JIRA_API_TOKEN || "",
    projectKey: process.env.JIRA_PROJECT_KEY || "",
  }

  const jiraClient = new JiraApiClient(jiraConfig)
  return jiraClient.getTicket(ticketKey)
}
