// Tab monitoring system for detecting closed tabs
export class TabMonitor {
  private monitoredTabs: Map<string, TabInfo> = new Map()
  private checkInterval: NodeJS.Timeout | null = null
  private readonly CHECK_FREQUENCY = 2000 // Check every 2 seconds

  constructor(private onTabClosed: (tabInfo: TabInfo) => void) {
    this.startMonitoring()
  }

  /**
   * Register a new tab to be monitored
   */
  registerTab(tabId: string, windowRef: Window | null, metadata: TabMetadata): void {
    if (!windowRef) {
      console.warn("[v0] Cannot monitor tab: window reference is null")
      return
    }

    const tabInfo: TabInfo = {
      id: tabId,
      windowRef,
      metadata,
      openedAt: Date.now(),
      lastChecked: Date.now(),
      isClosed: false,
    }

    this.monitoredTabs.set(tabId, tabInfo)
    console.log(`[v0] Registered tab for monitoring: ${tabId}`, metadata)
  }

  /**
   * Manually mark a tab as closed (for cleanup)
   */
  markTabClosed(tabId: string): void {
    const tabInfo = this.monitoredTabs.get(tabId)
    if (tabInfo && !tabInfo.isClosed) {
      tabInfo.isClosed = true
      tabInfo.closedAt = Date.now()
      console.log(`[v0] Tab manually marked as closed: ${tabId}`)
    }
  }

  /**
   * Remove a tab from monitoring
   */
  unregisterTab(tabId: string): void {
    this.monitoredTabs.delete(tabId)
    console.log(`[v0] Unregistered tab from monitoring: ${tabId}`)
  }

  /**
   * Start the monitoring loop
   */
  private startMonitoring(): void {
    if (this.checkInterval) {
      return // Already monitoring
    }

    console.log("[v0] Starting tab monitoring system...")

    this.checkInterval = setInterval(() => {
      this.checkAllTabs()
    }, this.CHECK_FREQUENCY)
  }

  /**
   * Stop the monitoring loop
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
      console.log("[v0] Stopped tab monitoring system")
    }
  }

  /**
   * Check all monitored tabs for closure
   */
  private checkAllTabs(): void {
    const now = Date.now()

    this.monitoredTabs.forEach((tabInfo, tabId) => {
      // Skip if already marked as closed
      if (tabInfo.isClosed) {
        return
      }

      // Update last checked time
      tabInfo.lastChecked = now

      // Check if tab is closed
      if (this.isTabClosed(tabInfo.windowRef)) {
        console.log(`[v0] Detected closed tab: ${tabId}`)

        // Mark as closed
        tabInfo.isClosed = true
        tabInfo.closedAt = now

        // Trigger callback
        this.onTabClosed(tabInfo)

        // Clean up after a delay
        setTimeout(() => {
          this.unregisterTab(tabId)
        }, 5000)
      }
    })
  }

  /**
   * Check if a tab window is closed
   */
  private isTabClosed(windowRef: Window | null): boolean {
    if (!windowRef) {
      return true
    }

    try {
      // Multiple checks to ensure accuracy
      return windowRef.closed === true
    } catch (error) {
      // If we can't access the window, assume it's closed
      console.log("[v0] Error checking tab status, assuming closed:", error)
      return true
    }
  }

  /**
   * Get all monitored tabs
   */
  getMonitoredTabs(): TabInfo[] {
    return Array.from(this.monitoredTabs.values())
  }

  /**
   * Get a specific tab info
   */
  getTabInfo(tabId: string): TabInfo | undefined {
    return this.monitoredTabs.get(tabId)
  }

  /**
   * Get count of active (not closed) tabs
   */
  getActiveTabCount(): number {
    return Array.from(this.monitoredTabs.values()).filter((tab) => !tab.isClosed).length
  }
}

// Types
export interface TabInfo {
  id: string
  windowRef: Window | null
  metadata: TabMetadata
  openedAt: number
  lastChecked: number
  isClosed: boolean
  closedAt?: number
}

export interface TabMetadata {
  type: "gmail" | "jira" | "other"
  url: string
  ticketId?: string
  customerEmail?: string
  purpose?: string
}

// Singleton instance
let tabMonitorInstance: TabMonitor | null = null

/**
 * Get or create the global tab monitor instance
 */
export function getTabMonitor(onTabClosed?: (tabInfo: TabInfo) => void): TabMonitor {
  if (!tabMonitorInstance && onTabClosed) {
    tabMonitorInstance = new TabMonitor(onTabClosed)
  } else if (!tabMonitorInstance) {
    throw new Error("TabMonitor not initialized. Provide onTabClosed callback on first call.")
  }
  return tabMonitorInstance
}

/**
 * Helper function to open and monitor a tab
 */
export function openAndMonitorTab(
  url: string,
  metadata: TabMetadata,
  onTabClosed?: (tabInfo: TabInfo) => void,
): string {
  // Generate unique tab ID
  const tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Open the tab
  const windowRef = window.open(url, "_blank")

  if (!windowRef) {
    console.error("[v0] Failed to open tab")
    throw new Error("Failed to open tab. Please check popup blocker settings.")
  }

  // Get or create monitor
  const monitor = getTabMonitor(
    onTabClosed ||
      ((tabInfo) => {
        console.log("[v0] Default handler: Tab closed", tabInfo)
      }),
  )

  // Register the tab
  monitor.registerTab(tabId, windowRef, metadata)

  return tabId
}
