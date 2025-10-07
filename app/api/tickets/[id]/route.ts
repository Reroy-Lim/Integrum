import { type NextRequest, NextResponse } from "next/server"
import type { Ticket } from "@/lib/types"

// Mock data that would normally come from the Agent Chain n8n workflow
const mockTicketDetails: Record<string, Ticket> = {
  "TKT-001": {
    id: "TKT-001",
    title: "High-Severity Bug Report: Desktop App Performance and Data Sync",
    status: "In Progress",
    date: "2024-01-15",
    sender: "Roy lim",
    category: "In Progression",
    description:
      "The desktop application is experiencing severe performance issues including frequent crashes, slow response times, and data synchronization failures. Users are unable to save their work properly and the application becomes unresponsive during peak usage hours.",
    ticketNumber: "TKT-001",
    priority: "High",
    issueType: "Bug",
    aiProposedSolution: [
      {
        solution: "Increase memory allocation and optimize database queries",
        explanation: "Performance issues often stem from insufficient memory and inefficient database operations",
        confidence: 85.2,
      },
      {
        solution: "Update to latest application version and clear cache",
        explanation: "Outdated versions and corrupted cache can cause sync and performance problems",
        confidence: 78.5,
      },
      {
        solution: "Check network connectivity and firewall settings",
        explanation: "Data sync issues may be related to network configuration problems",
        confidence: 65.8,
      },
    ],
    conversations: [
      {
        id: "conv-1",
        sender: "user",
        message:
          "Hi, I'm experiencing severe performance issues with the desktop app. It keeps crashing and my data isn't syncing properly.",
        timestamp: "2024-01-15T09:00:00Z",
        attachments: ["screenshot1.png", "error_log.txt"],
      },
      {
        id: "conv-2",
        sender: "helpdesk",
        message:
          "Thank you for reporting this issue. Our AI system has analyzed your problem and identified several potential solutions. We're prioritizing this as a high-severity issue. Can you please try the first recommended solution and let us know the results?",
        timestamp: "2024-01-15T10:30:00Z",
      },
    ],
  },
  "TKT-002": {
    id: "TKT-002",
    title: "RE: System authorization issue",
    status: "Resolved",
    date: "2024-01-14",
    sender: "Vercel Registration",
    category: "Resolved",
    description:
      "User reported authentication failures when trying to access the system. The issue was related to expired tokens and permission settings.",
    ticketNumber: "TKT-002",
    priority: "Medium",
    issueType: "Authentication",
    aiProposedSolution: [
      {
        solution: "Reset user authentication tokens and refresh permissions",
        explanation: "Token expiration is the most common cause of authentication issues",
        confidence: 92.1,
      },
    ],
    conversations: [
      {
        id: "conv-3",
        sender: "user",
        message: "I can't log into the system. It keeps saying my credentials are invalid.",
        timestamp: "2024-01-14T14:00:00Z",
      },
      {
        id: "conv-4",
        sender: "helpdesk",
        message:
          "I've reset your authentication tokens. Please try logging in again and let me know if you still experience issues.",
        timestamp: "2024-01-14T14:15:00Z",
      },
      {
        id: "conv-5",
        sender: "user",
        message: "Perfect! It's working now. Thank you for the quick resolution.",
        timestamp: "2024-01-14T14:20:00Z",
      },
    ],
  },
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ticketId = params.id

    // In a real implementation, this would call the n8n Agent Chain workflow
    // For now, we'll use mock data
    const ticket = mockTicketDetails[ticketId]

    if (!ticket) {
      return NextResponse.json({ success: false, error: "Ticket not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      ticket,
    })
  } catch (error) {
    console.error("Error fetching ticket details:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
