// Gmail monitoring utility for detecting auto-acknowledgement emails
export class GmailMonitor {
  private monitoringInterval: NodeJS.Timeout | null = null
  private startTime = 0
  private maxWaitTime: number = 5 * 60 * 1000 // 5 minutes
  private checkInterval = 3000 // 3 seconds

  constructor(
    private customerEmail: string,
    private onAcknowledgementFound: (ticketInfo: any) => void,
    private onTimeout: () => void,
    private onError: (error: string) => void,
  ) {}

  startMonitoring() {
    this.startTime = Date.now()
    console.log("[v0] Starting Gmail monitoring for auto-acknowledgement...")

    // Start monitoring Gmail inbox
    this.monitoringInterval = setInterval(() => {
      this.checkForAcknowledgement()
    }, this.checkInterval)

    // Set timeout to stop monitoring after 5 minutes
    setTimeout(() => {
      this.stopMonitoring()
      this.onTimeout()
    }, this.maxWaitTime)
  }

  private async checkForAcknowledgement() {
    try {
      // Check if we're still on Gmail page
      if (!window.location.hostname.includes("mail.google.com")) {
        console.log("[v0] Not on Gmail page, stopping monitoring")
        this.stopMonitoring()
        return
      }

      // Look for auto-acknowledgement email in Gmail DOM
      const acknowledgementEmail = this.findAcknowledgementEmail()

      if (acknowledgementEmail) {
        const emailTime = this.extractEmailTimestamp(acknowledgementEmail)

        if (this.isValidTimestamp(emailTime)) {
          console.log("[v0] Valid auto-acknowledgement found!")
          this.stopMonitoring()

          // Extract ticket information if available
          const ticketInfo = this.extractTicketInfo(acknowledgementEmail)
          this.onAcknowledgementFound(ticketInfo)
        } else {
          console.log("[v0] Found acknowledgement but timestamp is too old")
        }
      }
    } catch (error) {
      console.error("[v0] Error checking for acknowledgement:", error)
      this.onError("Error monitoring Gmail inbox")
    }
  }

  private findAcknowledgementEmail(): Element | null {
    console.log("[v0] Searching for acknowledgement email...")

    // Look for email rows in the Gmail inbox list
    const emailRows = document.querySelectorAll('tr[jsaction*="click"], .zA, [role="listitem"]')

    console.log(`[v0] Found ${emailRows.length} email rows to check`)

    for (const row of emailRows) {
      // Look for subject text in various Gmail elements
      const subjectElements = row.querySelectorAll("span, .bog, .y6, [data-thread-id] span")

      for (const element of subjectElements) {
        const text = element.textContent?.trim() || ""

        console.log(`[v0] Checking text: "${text}"`)

        if (
          text.includes("Your Message Has Been Received") ||
          text.includes("Auto Acknowledgement") ||
          text.includes("Auto-Acknowledgement") ||
          (text.includes("heyroy23415") && text.includes("Thank you for contacting Integrum"))
        ) {
          console.log(`[v0] Found potential acknowledgement email: "${text}"`)

          // Check if this is a recent email by looking for time indicators
          const timeElements = row.querySelectorAll("span[title], .xY span, .xW span")
          for (const timeEl of timeElements) {
            const timeText = timeEl.textContent || timeEl.getAttribute("title") || ""
            console.log(`[v0] Checking time: "${timeText}"`)

            if (this.isRecentTimeFormat(timeText)) {
              console.log(`[v0] Found recent acknowledgement email!`)
              return row
            }
          }
        }
      }
    }

    const senderElements = document.querySelectorAll('[email*="heyroy"], [title*="heyroy"], span')
    for (const sender of senderElements) {
      const senderText = sender.textContent || sender.getAttribute("title") || ""
      if (senderText.includes("heyroy23415")) {
        console.log(`[v0] Found sender heyroy23415, checking parent row`)
        const parentRow = sender.closest('tr, .zA, [role="listitem"]')
        if (parentRow) {
          // Check if this row has recent timestamp
          const timeElements = parentRow.querySelectorAll("span[title], .xY span, .xW span")
          for (const timeEl of timeElements) {
            const timeText = timeEl.textContent || timeEl.getAttribute("title") || ""
            if (this.isRecentTimeFormat(timeText)) {
              console.log(`[v0] Found recent email from heyroy23415!`)
              return parentRow
            }
          }
        }
      }
    }

    console.log("[v0] No acknowledgement email found")
    return null
  }

  private isRecentTimeFormat(timeText: string): boolean {
    if (!timeText) return false

    console.log(`[v0] Analyzing time format: "${timeText}"`)

    // Check for time formats that indicate recent emails
    const recentPatterns = [
      /^\d{1,2}:\d{2}\s?(AM|PM)$/i, // "3:34 PM"
      /^\d{1,2}:\d{2}$/, // "15:34" (24-hour)
      /\d+\s?(min|minute|sec|second)s?\s?ago/i, // "5 minutes ago"
      /^now$/i, // "now"
      /^just now$/i, // "just now"
    ]

    const isRecent = recentPatterns.some((pattern) => pattern.test(timeText.trim()))
    console.log(`[v0] Time "${timeText}" is recent: ${isRecent}`)

    return isRecent
  }

  private extractEmailTimestamp(emailElement: Element): Date | null {
    const timeElements = emailElement.querySelectorAll("span[title], .xY span, .xW span")

    for (const timeElement of timeElements) {
      const timeText = timeElement.textContent?.trim() || ""
      const titleTime = timeElement.getAttribute("title") || ""

      console.log(`[v0] Extracting timestamp from: "${timeText}" or title: "${titleTime}"`)

      // Try title attribute first (often has full timestamp)
      if (titleTime && titleTime.includes(":")) {
        const parsedDate = new Date(titleTime)
        if (!isNaN(parsedDate.getTime())) {
          console.log(`[v0] Parsed date from title: ${parsedDate}`)
          return parsedDate
        }
      }

      // Parse time format like "3:34 PM"
      if (timeText.match(/^\d{1,2}:\d{2}\s?(AM|PM)$/i)) {
        const today = new Date()
        const [time, period] = timeText.split(/\s+/)
        const [hours, minutes] = time.split(":").map(Number)

        let hour24 = hours
        if (period?.toUpperCase() === "PM" && hours !== 12) hour24 += 12
        if (period?.toUpperCase() === "AM" && hours === 12) hour24 = 0

        today.setHours(hour24, minutes, 0, 0)
        console.log(`[v0] Parsed time: ${today}`)
        return today
      }
    }

    console.log("[v0] Could not extract timestamp")
    return null
  }

  private isValidTimestamp(emailTime: Date | null): boolean {
    if (!emailTime) return false

    const now = Date.now()
    const emailTimestamp = emailTime.getTime()
    const timeDifference = Math.abs(now - emailTimestamp)

    // Allow 10 minutes tolerance
    const maxTimeDifference = 10 * 60 * 1000

    return timeDifference <= maxTimeDifference
  }

  private extractTicketInfo(emailElement: Element): any {
    // Try to extract ticket information from email content
    const contentElement = emailElement.querySelector(".ii, .adn, .adO")
    const content = contentElement?.textContent || ""

    // Look for ticket patterns like "KST-123" or "Ticket #123"
    const ticketMatch = content.match(/([A-Z]+-\d+|Ticket #\d+|#[A-Z]+-\d+)/i)

    return {
      ticketKey: ticketMatch ? ticketMatch[1] : null,
      emailContent: content.substring(0, 200), // First 200 chars
      timestamp: new Date().toISOString(),
    }
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
      console.log("[v0] Stopped Gmail monitoring")
    }
  }
}
