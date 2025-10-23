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
        "[v0] 🎯 Jira API: Starting fetch for user:",
        userEmail,
        "| Is master:",
        isMasterAccount,
        "| Requested limit:",
        maxResults,
      )

      const jql = `project = "${this.config.projectKey}" ORDER BY updated DESC`
      const baseUrl = this.config.baseUrl.replace(/\/$/, "")

      let allIssues: any[] = []
      let startAt = 0
      const pageSize = 50 // Jira's default max per request
      let totalFetched = 0
      let pageNumber = 0

      while (totalFetched < maxResults) {
        pageNumber++
        const remainingToFetch = maxResults - totalFetched
        const currentPageSize = Math.min(pageSize, remainingToFetch)

        const params = new URLSearchParams({
          jql,
          startAt: startAt.toString(),
          maxResults: currentPageSize.toString(),
          fields: "summary,status,created,updated,assignee,reporter,description,priority,issuetype,attachment",
        })

        const requestUrl = `${baseUrl}/rest/api/3/search?${params.toString()}`

        console.log(
          `[v0] 📄 PAGE ${pageNumber} - Requesting ${currentPageSize} tickets starting at position ${startAt}`,
        )

        const response = await fetch(requestUrl, {
          method: "GET",
          headers: this.getAuthHeaders(),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error("[v0] ❌ Jira API error:", errorText)
          throw new Error(`Failed to fetch tickets: ${response.statusText}`)
        }

        const data = await response.json()
        const issues = data.issues || []
        const jiraTotalAvailable = data.total || 0

        console.log(
          `[v0] ✓ PAGE ${pageNumber} received ${issues.length} tickets | Jira reports ${jiraTotalAvailable} total in project`,
        )

        if (issues.length === 0) {
          console.log(`[v0] 🏁 No more tickets available - received 0 tickets on page ${pageNumber}`)
          break
        }

        allIssues = allIssues.concat(issues)
        totalFetched += issues.length

        console.log(
          `[v0] 📊 Progress: ${totalFetched}/${maxResults} tickets fetched (${jiraTotalAvailable} reported by Jira)`,
        )

        if (issues.length < currentPageSize) {
          console.log(`[v0] 🏁 End of results - page returned ${issues.length} tickets, expected ${currentPageSize}`)
          break
        }

        if (jiraTotalAvailable > 0 && totalFetched >= jiraTotalAvailable) {
          console.log(`[v0] 🏁 Fetched all ${jiraTotalAvailable} tickets available in Jira`)
          break
        }

        startAt += issues.length
        console.log(`[v0] ➡️  Continuing to next page, new startAt: ${startAt}`)
      }

      console.log(`[v0] ✅ PAGINATION COMPLETE - Fetched ${totalFetched} tickets across ${pageNumber} page(s)`)
      console.log(`[v0] 📦 Total issues in array before transformation: ${allIssues.length}`)

      const allTickets = allIssues.map((issue: any) => this.transformJiraIssue(issue))

      console.log("[v0] 🎫 Total tickets after transformation:", allTickets.length)

      if (isMasterAccount) {
        console.log("[v0] 👑 Master account - returning all", allTickets.length, "tickets without filtering")
        return allTickets
      }

      console.log("[v0] 🔍 Non-master account - filtering tickets for:", userEmail)

      const filteredTickets = allTickets.filter((ticket, index) => {
        const description = ticket.description || ""

        const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,6})(?=[A-Z]|\s|$|[^a-zA-Z0-9])/

        const patterns = [
          new RegExp(`From:\\s*${emailPattern.source}`),
          new RegExp(`from:\\s*${emailPattern.source}`),
          new RegExp(`FROM:\\s*${emailPattern.source}`),
          new RegExp(`From:\\s*<${emailPattern.source}>`),
          new RegExp(`from:\\s*<${emailPattern.source}>`),
          new RegExp(`From:\\s*\\n\\s*${emailPattern.source}`),
          new RegExp(`From\\s*:\\s*${emailPattern.source}`),
        ]

        let ticketOwnerEmail: string | null = null
        let matchedPattern = -1

        for (let i = 0; i < patterns.length; i++) {
          const match = description.match(patterns[i])
          if (match && match[1]) {
            ticketOwnerEmail = match[1].trim().toLowerCase()
            matchedPattern = i
            break
          }
        }

        if (!ticketOwnerEmail && description.toLowerCase().includes(userEmail.toLowerCase())) {
          ticketOwnerEmail = userEmail.toLowerCase()
          matchedPattern = 999
        }

        const matches = ticketOwnerEmail === userEmail.toLowerCase()

        if (index < 5) {
          console.log(`[v0] Ticket ${ticket.key}:`)
          console.log(`  - Extracted email: ${ticketOwnerEmail || "NONE"}`)
          console.log(`  - Pattern used: ${matchedPattern >= 0 ? matchedPattern : "none"}`)
          console.log(`  - Matches user: ${matches}`)
          console.log(`  - Description preview: ${description.substring(0, 150)}...`)
        }

        return matches
      })

      console.log(
        `[v0] ✅ FILTERING COMPLETE - Showing ${filteredTickets.length} of ${allTickets.length} tickets for user ${userEmail}`,
      )

      if (filteredTickets.length === 0 && allTickets.length > 0) {
        console.log("[v0] ⚠️ NO MATCHES FOUND for user:", userEmail)
        console.log("[v0] Showing full descriptions of first 2 tickets:")

        for (let i = 0; i < Math.min(2, allTickets.length); i++) {
          const ticket = allTickets[i]
          const desc = ticket.description || "No description"
          console.log(`\n===== Ticket ${ticket.key} FULL DESCRIPTION =====`)
          console.log(desc)
          console.log(`===== END ${ticket.key} =====\n`)
        }
      }

      return filteredTickets
    } catch (error) {
      console.error("[v0] Error:", error instanceof Error ? error.message : "Unknown error")
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
      const response = await fetch(`${baseUrl}/rest/api/3/search?${params.toString()}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      })

      console.log("[v0] Response status:", response.status, response.statusText)

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

  async transitionTicket(ticketKey: string, transitionName = "Done"): Promise<boolean> {
    try {
      const transitionsResponse = await fetch(`${this.config.baseUrl}/rest/api/3/issue/${ticketKey}/transitions`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      })

      if (!transitionsResponse.ok) {
        throw new Error(`Failed to fetch transitions: ${transitionsResponse.statusText}`)
      }

      const transitionsData = await transitionsResponse.json()
      const transitions = transitionsData.transitions || []

      const doneTransition = transitions.find((t: any) => t.name.toLowerCase() === transitionName.toLowerCase())

      if (!doneTransition) {
        console.error(
          `[v0] Transition "${transitionName}" not found. Available transitions:`,
          transitions.map((t: any) => t.name),
        )
        throw new Error(`Transition "${transitionName}" not available for this ticket`)
      }

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
        console.error("[v0] Transition error:", errorText)
        throw new Error(`Failed to transition ticket: ${transitionResponse.statusText}`)
      }

      console.log(`[v0] Successfully transitioned ticket ${ticketKey} to ${transitionName}`)
      return true
    } catch (error) {
      console.error("[v0] Error transitioning ticket:", error)
      return false
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

    return "In Progression"
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
