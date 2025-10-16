export interface N8nExecution {
  id: string
  finished: boolean
  mode: string
  retryOf?: string
  retrySuccessId?: string
  startedAt: string
  stoppedAt?: string
  workflowId: string
  waitTill?: string
  status: "success" | "error" | "waiting" | "running"
  data?: {
    resultData?: {
      runData?: Record<string, any>
    }
  }
}

export interface N8nExecutionsResponse {
  data: N8nExecution[]
  nextCursor?: string
}

export class N8nApi {
  private baseUrl: string
  private apiKey: string

  constructor() {
    this.baseUrl = process.env.N8N_API_URL || ""
    this.apiKey = process.env.N8N_API_KEY || ""

    if (!this.baseUrl || !this.apiKey) {
      console.warn("[v0] N8N_API_URL or N8N_API_KEY not configured")
    }
  }

  async getRecentExecutions(limit = 10): Promise<N8nExecution[]> {
    if (!this.baseUrl || !this.apiKey) {
      throw new Error("N8N API not configured. Please add N8N_API_URL and N8N_API_KEY environment variables.")
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/executions?limit=${limit}`, {
        headers: {
          "X-N8N-API-KEY": this.apiKey,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`N8N API error: ${response.status} ${response.statusText}`)
      }

      const data: N8nExecutionsResponse = await response.json()
      return data.data || []
    } catch (error) {
      console.error("[v0] Error fetching n8n executions:", error)
      throw error
    }
  }

  async getExecution(executionId: string): Promise<N8nExecution | null> {
    if (!this.baseUrl || !this.apiKey) {
      throw new Error("N8N API not configured")
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/executions/${executionId}`, {
        headers: {
          "X-N8N-API-KEY": this.apiKey,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`N8N API error: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error("[v0] Error fetching n8n execution:", error)
      throw error
    }
  }

  // Check if there's a recent successful execution (within last 5 minutes)
  async hasRecentSuccessfulExecution(userEmail: string): Promise<{ success: boolean; execution?: N8nExecution }> {
    try {
      const executions = await this.getRecentExecutions(20)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

      // Find the most recent successful execution
      const recentSuccess = executions.find((exec) => {
        const startedAt = new Date(exec.startedAt)
        return exec.status === "success" && exec.finished && startedAt > fiveMinutesAgo
      })

      return {
        success: !!recentSuccess,
        execution: recentSuccess,
      }
    } catch (error) {
      console.error("[v0] Error checking recent executions:", error)
      return { success: false }
    }
  }
}

export const n8nApi = new N8nApi()
