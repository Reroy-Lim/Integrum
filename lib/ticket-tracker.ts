// Ticket categorization tracking system
export interface TicketCategory {
  ticketKey: string
  customerEmail: string
  checkCount: number
  lastChecked: Date
  finalized: boolean
}

export class TicketTracker {
  private storageKey = "jira_ticket_categories"

  // Get all categorized tickets from localStorage
  getCategories(): Map<string, TicketCategory> {
    if (typeof window === "undefined") return new Map()

    const stored = localStorage.getItem(this.storageKey)
    if (!stored) return new Map()

    try {
      const data = JSON.parse(stored)
      return new Map(
        Object.entries(data).map(([key, value]: [string, any]) => [
          key,
          {
            ...value,
            lastChecked: new Date(value.lastChecked),
          },
        ]),
      )
    } catch {
      return new Map()
    }
  }

  // Save categories to localStorage
  saveCategories(categories: Map<string, TicketCategory>): void {
    if (typeof window === "undefined") return

    const data = Object.fromEntries(categories)
    localStorage.setItem(this.storageKey, JSON.stringify(data))
  }

  // Get category for a specific ticket
  getCategory(ticketKey: string): TicketCategory | undefined {
    const categories = this.getCategories()
    return categories.get(ticketKey)
  }

  // Update or create a category
  updateCategory(ticketKey: string, customerEmail: string): void {
    const categories = this.getCategories()
    const existing = categories.get(ticketKey)

    if (existing) {
      // Increment check count
      existing.checkCount++
      existing.lastChecked = new Date()

      // Finalize after 3 checks
      if (existing.checkCount >= 3) {
        existing.finalized = true
      }

      categories.set(ticketKey, existing)
    } else {
      // Create new category
      categories.set(ticketKey, {
        ticketKey,
        customerEmail,
        checkCount: 1,
        lastChecked: new Date(),
        finalized: false,
      })
    }

    this.saveCategories(categories)
  }

  // Check if a ticket needs categorization
  needsCategorization(ticketKey: string): boolean {
    const category = this.getCategory(ticketKey)

    // New ticket - needs categorization
    if (!category) return true

    // Already finalized - no need to check again
    if (category.finalized) return false

    // Not finalized and check count < 3 - needs categorization
    return category.checkCount < 3
  }

  // Get all tickets for a specific customer email
  getTicketsByEmail(email: string): string[] {
    const categories = this.getCategories()
    const tickets: string[] = []

    categories.forEach((category) => {
      if (category.customerEmail.toLowerCase() === email.toLowerCase()) {
        tickets.push(category.ticketKey)
      }
    })

    return tickets
  }

  // Extract customer email from ticket description
  extractEmailFromDescription(description: string): string | null {
    if (!description) return null

    // Look for "From: email@example.com" pattern
    const fromMatch = description.match(/From:\s*([^\s\n]+@[^\s\n]+)/i)
    if (fromMatch) {
      return fromMatch[1].trim()
    }

    // Fallback: look for any email pattern
    const emailMatch = description.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i)
    if (emailMatch) {
      return emailMatch[1].trim()
    }

    return null
  }
}
