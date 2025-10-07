export interface Ticket {
  id: string
  title: string
  status: "In Progress" | "Resolved" | "Awaiting Reply"
  date: string
  sender: string
  category: "In Progression" | "Resolved" | "Pending Reply"
  description?: string
  ticketNumber?: string
  aiProposedSolution?: AIProposedSolution[]
  conversations?: Conversation[]
  priority?: string
  issueType?: string
}

export interface AIProposedSolution {
  solution: string
  explanation: string
  confidence: number
}

export interface Conversation {
  id: string
  sender: "user" | "helpdesk"
  message: string
  timestamp: string
  attachments?: string[]
}

export interface TicketDetailResponse {
  ticket: Ticket
  success: boolean
  error?: string
}

export interface ConversationResponse {
  conversations: Conversation[]
  success: boolean
  error?: string
}
