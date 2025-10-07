"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Mail, Loader2, CheckCircle, Clock, AlertTriangle } from "lucide-react"

interface GmailMonitoringDialogProps {
  isOpen: boolean
  onClose: () => void
  customerEmail: string
}

export function GmailMonitoringDialog({ isOpen, onClose, customerEmail }: GmailMonitoringDialogProps) {
  const [status, setStatus] = useState<"monitoring" | "found" | "timeout" | "error">("monitoring")
  const [countdown, setCountdown] = useState(300) // 5 minutes in seconds
  const [ticketInfo, setTicketInfo] = useState<any>(null)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    if (isOpen && status === "monitoring") {
      startGmailMonitoring()
    }
  }, [isOpen])

  useEffect(() => {
    if (status === "monitoring" && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0 && status === "monitoring") {
      setStatus("timeout")
    }
  }, [countdown, status])

  const startGmailMonitoring = () => {
    console.log("[v0] Starting Gmail monitoring...")

    if (typeof window !== "undefined") {
      // Check if we're on Gmail
      if (!window.location.hostname.includes("mail.google.com")) {
        console.log("[v0] Not on Gmail, redirecting...")
        window.open("https://mail.google.com", "_blank")

        // Wait a moment then start monitoring
        setTimeout(() => {
          startActualMonitoring()
        }, 3000)
      } else {
        startActualMonitoring()
      }
    }
  }

  const startActualMonitoring = () => {
    import("@/lib/gmail-monitor").then(({ GmailMonitor }) => {
      console.log("[v0] Creating Gmail monitor instance...")

      const monitor = new GmailMonitor(
        customerEmail,
        (foundTicketInfo) => {
          console.log("[v0] Acknowledgement found!", foundTicketInfo)
          setTicketInfo(foundTicketInfo)
          setStatus("found")
        },
        () => {
          console.log("[v0] Monitoring timeout")
          setStatus("timeout")
        },
        (error) => {
          console.log("[v0] Monitoring error:", error)
          setErrorMessage(error)
          setStatus("error")
        },
      )

      monitor.startMonitoring()

      // Cleanup on dialog close
      return () => {
        console.log("[v0] Cleaning up monitor")
        monitor.stopMonitoring()
      }
    })
  }

  const handleGoToTickets = () => {
    if (ticketInfo?.ticketKey) {
      window.location.href = `/ticket/${ticketInfo.ticketKey}`
    } else {
      window.location.href = "/?view=yourTickets"
    }
    onClose()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const renderContent = () => {
    switch (status) {
      case "monitoring":
        return (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Monitoring Gmail Inbox</span>
              </div>
              <p className="text-sm text-blue-700 mb-2">
                Watching for auto-acknowledgement email from Integrum Global...
              </p>
              <div className="flex items-center space-x-2">
                <Clock className="w-3 h-3 text-blue-600" />
                <span className="text-xs text-blue-600">Time remaining: {formatTime(countdown)}</span>
              </div>
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Monitoring email for:</p>
              <p className="text-sm font-medium text-gray-800">{customerEmail}</p>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500 mb-3">
                The system will automatically detect when the auto-acknowledgement email arrives and redirect you to
                your ticket page.
              </p>
              <Button variant="outline" onClick={onClose} className="w-full bg-transparent">
                Stop Monitoring
              </Button>
            </div>
          </div>
        )

      case "found":
        return (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Auto-Acknowledgement Detected!</span>
              </div>
              <p className="text-sm text-green-700">
                Your ticket has been successfully submitted and acknowledged by our system.
              </p>
            </div>

            {ticketInfo && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-600 font-medium mb-1">Ticket Information:</p>
                {ticketInfo.ticketKey && (
                  <p className="text-sm font-medium text-blue-800">Ticket: {ticketInfo.ticketKey}</p>
                )}
                <p className="text-xs text-blue-600">
                  Detected at: {new Date(ticketInfo.timestamp).toLocaleTimeString()}
                </p>
              </div>
            )}

            <div className="text-center">
              <Button onClick={handleGoToTickets} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                {ticketInfo?.ticketKey ? `Go to Ticket ${ticketInfo.ticketKey}` : "Go to Your Tickets"}
              </Button>
            </div>
          </div>
        )

      case "timeout":
        return (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">Monitoring Timeout</span>
              </div>
              <p className="text-sm text-yellow-700 mb-2">
                We didn't detect the auto-acknowledgement email within 5 minutes.
              </p>
              <p className="text-xs text-yellow-600">
                This might happen if there's a delay in email delivery or if you're not on the Gmail page.
              </p>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setStatus("monitoring")
                  setCountdown(300)
                  startGmailMonitoring()
                }}
                className="flex-1"
              >
                Retry Monitoring
              </Button>
              <Button
                onClick={() => (window.location.href = "/?view=yourTickets")}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Go to Tickets
              </Button>
            </div>
          </div>
        )

      case "error":
        return (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">Monitoring Error</span>
              </div>
              <p className="text-sm text-red-700 mb-2">{errorMessage || "An error occurred while monitoring Gmail."}</p>
              <p className="text-xs text-red-600">Please ensure you're on the Gmail page and try again.</p>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setStatus("monitoring")
                  setCountdown(300)
                  setErrorMessage("")
                  startGmailMonitoring()
                }}
                className="flex-1"
              >
                Retry
              </Button>
              <Button
                onClick={() => (window.location.href = "/?view=yourTickets")}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Go to Tickets
              </Button>
            </div>
          </div>
        )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full bg-white">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-center">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center ${
                status === "found"
                  ? "bg-green-100"
                  : status === "error"
                    ? "bg-red-100"
                    : status === "timeout"
                      ? "bg-yellow-100"
                      : "bg-blue-100"
              }`}
            >
              {status === "found" ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : status === "error" ? (
                <AlertTriangle className="w-8 h-8 text-red-600" />
              ) : status === "timeout" ? (
                <Clock className="w-8 h-8 text-yellow-600" />
              ) : (
                <Mail className="w-8 h-8 text-blue-600" />
              )}
            </div>
          </div>
          <DialogTitle className="text-xl font-semibold text-center text-gray-800">
            {status === "found"
              ? "Acknowledgement Received!"
              : status === "error"
                ? "Monitoring Error"
                : status === "timeout"
                  ? "Monitoring Timeout"
                  : "Monitoring Gmail"}
          </DialogTitle>
        </DialogHeader>

        {renderContent()}
      </DialogContent>
    </Dialog>
  )
}
