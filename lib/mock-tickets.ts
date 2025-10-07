export interface MockTicket {
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

export const mockTickets: MockTicket[] = [
  {
    id: "1",
    key: "HELP-001",
    summary: "Login issues with new system",
    status: {
      name: "In Progress",
      statusCategory: {
        name: "In Progress",
      },
    },
    created: "2024-01-15T08:00:00Z",
    updated: "2024-01-15T10:30:00Z",
    assignee: {
      displayName: "Support Team",
      emailAddress: "support@integrum.global",
    },
    reporter: {
      displayName: "Roy Lim",
      emailAddress: "reroylim3680@gmail.com",
    },
    description: "User experiencing difficulties logging into the new system after recent updates.",
    priority: {
      name: "High",
    },
    issuetype: {
      name: "Bug",
    },
  },
  {
    id: "2",
    key: "HELP-002",
    summary: "Email notifications not working",
    status: {
      name: "Resolved",
      statusCategory: {
        name: "Done",
      },
    },
    created: "2024-01-14T14:00:00Z",
    updated: "2024-01-14T15:45:00Z",
    assignee: {
      displayName: "Tech Support",
      emailAddress: "tech@integrum.global",
    },
    reporter: {
      displayName: "HG Lim",
      emailAddress: "williamlimh.g@gmail.com",
    },
    description: "Email notifications for ticket updates are not being received.",
    priority: {
      name: "Medium",
    },
    issuetype: {
      name: "Bug",
    },
  },
  {
    id: "3",
    key: "HELP-003",
    summary: "Password reset request",
    status: {
      name: "Pending Reply",
      statusCategory: {
        name: "To Do",
      },
    },
    created: "2024-01-13T09:00:00Z",
    updated: "2024-01-13T09:20:00Z",
    reporter: {
      displayName: "Roy Yeye",
      emailAddress: "yeyeroy55@gmail.com",
    },
    description: "User needs password reset for account access.",
    priority: {
      name: "Low",
    },
    issuetype: {
      name: "Task",
    },
  },
]

export const getTicketsByUser = (userEmail: string): MockTicket[] => {
  return mockTickets.filter(
    (ticket) => ticket.reporter.emailAddress === userEmail || ticket.assignee?.emailAddress === userEmail,
  )
}

export const getTicketByKey = (key: string): MockTicket | null => {
  return mockTickets.find((ticket) => ticket.key === key) || null
}
