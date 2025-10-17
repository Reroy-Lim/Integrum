// Alert and callback handler for closed tabs
import type { TabInfo } from "./tab-monitor"

export class TabAlertHandler {
  private alertedTabs: Set<string> = new Set()

  /**
   * Handle a closed tab event
   */
  handleClosedTab(tabInfo: TabInfo): void {
    // Prevent duplicate alerts
    if (this.alertedTabs.has(tabInfo.id)) {
      console.log(`[v0] Alert already sent for tab: ${tabInfo.id}`)
      return
    }

    // Mark as alerted
    this.alertedTabs.add(tabInfo.id)

    // Calculate duration
    const duration = tabInfo.closedAt ? tabInfo.closedAt - tabInfo.openedAt : 0
    const durationSeconds = Math.floor(duration / 1000)

    console.log(`[v0] Tab closed after ${durationSeconds} seconds:`, tabInfo.metadata)

    // Trigger appropriate alert based on tab type
    switch (tabInfo.metadata.type) {
      case "gmail":
        this.handleGmailTabClosed(tabInfo, durationSeconds)
        break
      case "jira":
        this.handleJiraTabClosed(tabInfo, durationSeconds)
        break
      default:
        this.handleGenericTabClosed(tabInfo, durationSeconds)
    }

    // Send callback to server if needed
    this.sendClosureNotification(tabInfo, durationSeconds)

    // Clean up old alerts after 1 hour
    setTimeout(
      () => {
        this.alertedTabs.delete(tabInfo.id)
      },
      60 * 60 * 1000,
    )
  }

  /**
   * Handle Gmail tab closure
   */
  private handleGmailTabClosed(tabInfo: TabInfo, durationSeconds: number): void {
    const { ticketId, customerEmail } = tabInfo.metadata

    // Check if tab was closed too quickly (might indicate accidental closure)
    if (durationSeconds < 30) {
      this.showWarningDialog({
        title: "Gmail Tab Closed Quickly",
        message: `The Gmail compose window was closed after only ${durationSeconds} seconds. Did you send your email?`,
        ticketId,
        customerEmail,
        actions: [
          {
            label: "Reopen Gmail",
            action: () => this.reopenGmailTab(tabInfo),
          },
          {
            label: "I Sent the Email",
            action: () => this.confirmEmailSent(ticketId, customerEmail),
          },
        ],
      })
    } else {
      // Normal closure - show confirmation
      this.showInfoNotification({
        title: "Gmail Tab Closed",
        message: `Gmail was open for ${durationSeconds} seconds. If you sent your email, please wait for the auto-acknowledgement.`,
        ticketId,
      })
    }
  }

  /**
   * Handle JIRA tab closure
   */
  private handleJiraTabClosed(tabInfo: TabInfo, durationSeconds: number): void {
    console.log(`[v0] JIRA tab closed after ${durationSeconds} seconds`)

    // Just log for JIRA tabs, no alert needed
    this.sendClosureNotification(tabInfo, durationSeconds)
  }

  /**
   * Handle generic tab closure
   */
  private handleGenericTabClosed(tabInfo: TabInfo, durationSeconds: number): void {
    console.log(`[v0] Generic tab closed after ${durationSeconds} seconds:`, tabInfo.metadata.url)
  }

  /**
   * Show warning dialog
   */
  private showWarningDialog(config: AlertConfig): void {
    // Store in localStorage to trigger dialog in main app
    const alertData = {
      type: "warning",
      timestamp: Date.now(),
      ...config,
    }

    localStorage.setItem("tab_closure_alert", JSON.stringify(alertData))
    window.dispatchEvent(new CustomEvent("tab-closed", { detail: alertData }))
  }

  /**
   * Show info notification
   */
  private showInfoNotification(config: { title: string; message: string; ticketId?: string }): void {
    const alertData = {
      type: "info",
      timestamp: Date.now(),
      ...config,
    }

    localStorage.setItem("tab_closure_notification", JSON.stringify(alertData))
    window.dispatchEvent(new CustomEvent("tab-notification", { detail: alertData }))
  }

  /**
   * Reopen Gmail tab
   */
  private reopenGmailTab(tabInfo: TabInfo): void {
    console.log("[v0] Reopening Gmail tab:", tabInfo.metadata.url)
    window.open(tabInfo.metadata.url, "_blank")
  }

  /**
   * Confirm email was sent
   */
  private confirmEmailSent(ticketId?: string, customerEmail?: string): void {
    console.log("[v0] User confirmed email was sent", { ticketId, customerEmail })

    // Navigate to waiting page
    if (ticketId) {
      window.location.href = `/ticket-processing/${ticketId}`
    }
  }

  /**
   * Send closure notification to server
   */
  private async sendClosureNotification(tabInfo: TabInfo, durationSeconds: number): Promise<void> {
    try {
      await fetch("/api/tab-closure", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tabId: tabInfo.id,
          type: tabInfo.metadata.type,
          url: tabInfo.metadata.url,
          ticketId: tabInfo.metadata.ticketId,
          customerEmail: tabInfo.metadata.customerEmail,
          openedAt: tabInfo.openedAt,
          closedAt: tabInfo.closedAt,
          durationSeconds,
        }),
      })
    } catch (error) {
      console.error("[v0] Error sending closure notification:", error)
    }
  }
}

interface AlertConfig {
  title: string
  message: string
  ticketId?: string
  customerEmail?: string
  actions: Array<{
    label: string
    action: () => void
  }>
}

// Singleton instance
let alertHandlerInstance: TabAlertHandler | null = null

export function getTabAlertHandler(): TabAlertHandler {
  if (!alertHandlerInstance) {
    alertHandlerInstance = new TabAlertHandler()
  }
  return alertHandlerInstance
}
