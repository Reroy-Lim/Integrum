interface JiraComment {
  id: string
  author: {
    emailAddress: string
    displayName: string
  }
  body: string
  created: string
  updated: string
}

interface JiraCommentResponse {
  comments: JiraComment[]
  total: number
}

export class JiraCommentsClient {
  private baseUrl: string
  private email: string
  private apiToken: string

  constructor(config: { baseUrl: string; email: string; apiToken: string }) {
    this.baseUrl = config.baseUrl
    this.email = config.email
    this.apiToken = config.apiToken
  }

  private getAuthHeader(): string {
    return `Basic ${Buffer.from(`${this.email}:${this.apiToken}`).toString("base64")}`
  }

  async getComments(issueKey: string): Promise<JiraComment[]> {
    const url = `${this.baseUrl}/rest/api/3/issue/${issueKey}/comment`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: this.getAuthHeader(),
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch comments: ${response.statusText}`)
    }

    const data: JiraCommentResponse = await response.json()
    return data.comments || []
  }

  async addComment(issueKey: string, commentText: string): Promise<JiraComment> {
    const url = `${this.baseUrl}/rest/api/3/issue/${issueKey}/comment`

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: this.getAuthHeader(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        body: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: commentText,
                },
              ],
            },
          ],
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to add comment: ${response.statusText}`)
    }

    return await response.json()
  }

  extractTextFromADF(body: any): string {
    // Extract plain text from Atlassian Document Format (ADF)
    if (!body || !body.content) return ""

    let text = ""
    for (const node of body.content) {
      if (node.type === "paragraph" && node.content) {
        for (const contentNode of node.content) {
          if (contentNode.type === "text") {
            text += contentNode.text
          }
        }
        text += "\n"
      }
    }
    return text.trim()
  }
}

// Helper function to create a Jira comments client
export function getJiraCommentsClient(): JiraCommentsClient {
  const baseUrl = process.env.JIRA_BASE_URL
  const email = process.env.JIRA_EMAIL
  const apiToken = process.env.JIRA_API_TOKEN

  if (!baseUrl || !email || !apiToken) {
    throw new Error("Missing Jira configuration")
  }

  return new JiraCommentsClient({ baseUrl, email, apiToken })
}
