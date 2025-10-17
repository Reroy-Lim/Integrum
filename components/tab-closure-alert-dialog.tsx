"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Info } from "lucide-react"

export function TabClosureAlertDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [alertData, setAlertData] = useState<any>(null)

  useEffect(() => {
    // Listen for tab closure events
    const handleTabClosed = (event: CustomEvent) => {
      console.log("[v0] Tab closure alert received:", event.detail)
      setAlertData(event.detail)
      setIsOpen(true)
    }

    const handleTabNotification = (event: CustomEvent) => {
      console.log("[v0] Tab notification received:", event.detail)
      setAlertData(event.detail)
      setIsOpen(true)
    }

    window.addEventListener("tab-closed" as any, handleTabClosed)
    window.addEventListener("tab-notification" as any, handleTabNotification)

    // Check for stored alerts on mount
    const storedAlert = localStorage.getItem("tab_closure_alert")
    if (storedAlert) {
      try {
        const data = JSON.parse(storedAlert)
        // Only show if less than 5 minutes old
        if (Date.now() - data.timestamp < 5 * 60 * 1000) {
          setAlertData(data)
          setIsOpen(true)
        }
        localStorage.removeItem("tab_closure_alert")
      } catch (error) {
        console.error("[v0] Error parsing stored alert:", error)
      }
    }

    return () => {
      window.removeEventListener("tab-closed" as any, handleTabClosed)
      window.removeEventListener("tab-notification" as any, handleTabNotification)
    }
  }, [])

  const handleClose = () => {
    setIsOpen(false)
    setAlertData(null)
    localStorage.removeItem("tab_closure_alert")
    localStorage.removeItem("tab_closure_notification")
  }

  const handleAction = (action: () => void) => {
    action()
    handleClose()
  }

  if (!alertData) return null

  const isWarning = alertData.type === "warning"

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md w-full bg-white">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-center">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center ${
                isWarning ? "bg-yellow-100" : "bg-blue-100"
              }`}
            >
              {isWarning ? (
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              ) : (
                <Info className="w-8 h-8 text-blue-600" />
              )}
            </div>
          </div>
          <DialogTitle className="text-xl font-semibold text-center text-gray-800">{alertData.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className={`p-4 border rounded-lg ${
              isWarning ? "bg-yellow-50 border-yellow-200" : "bg-blue-50 border-blue-200"
            }`}
          >
            <p className={`text-sm ${isWarning ? "text-yellow-700" : "text-blue-700"}`}>{alertData.message}</p>
          </div>

          {alertData.ticketId && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-600">Ticket ID:</p>
              <p className="text-sm font-medium text-gray-800">{alertData.ticketId}</p>
              {alertData.customerEmail && (
                <>
                  <p className="text-xs text-gray-600 mt-2">Email:</p>
                  <p className="text-sm font-medium text-gray-800">{alertData.customerEmail}</p>
                </>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col space-y-2 sm:space-y-0 sm:flex-row sm:space-x-2">
          {alertData.actions && alertData.actions.length > 0 ? (
            alertData.actions.map((action: any, index: number) => (
              <Button
                key={index}
                onClick={() => handleAction(action.action)}
                className={index === 0 ? "bg-primary hover:bg-primary/90 text-white" : ""}
                variant={index === 0 ? "default" : "outline"}
              >
                {action.label}
              </Button>
            ))
          ) : (
            <Button onClick={handleClose} className="w-full bg-primary hover:bg-primary/90 text-white">
              OK
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
