"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Loader2, Mail, CheckCircle2 } from "@/components/icons"
import { Button } from "@/components/ui/button"

interface TicketCreationMonitorProps {
  isOpen: boolean
  onClose: () => void
  userEmail: string
}

export function TicketCreationMonitor({ isOpen, onClose, userEmail }: TicketCreationMonitorProps) {
  const [status, setStatus] = useState<"waiting" | "checking" | "completed">("waiting")
  const [message, setMessage] = useState("Ticket is being created in process, Please be patient")
  const [ticketInfo, setTicketInfo] = useState<{ key: string; summary: string } | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    if (!isOpen) {
      // Reset state when dialog closes
      setStatus("waiting")
      setMessage("Ticket is being created in process, Please be patient")
      setTicketInfo(null)
      setElapsedTime(0)
      return
    }

    console.log("[v0] Ticket creation monitor started for:", userEmail)

    // Start elapsed time counter
    const timeInterval = setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 1000)

    // Wait 3 minutes before starting to check workflow status
    const initialDelay = setTimeout(
      () => {
        console.log("[v0] 3 minutes elapsed, starting workflow status checks")
        setStatus("checking")
        setMessage("Checking workflow execution status...")

        // Start polling every 10 seconds
        const pollInterval = setInterval(async () => {
          try {
            console.log("[v0] Polling workflow status...")
            const response = await fetch(`/api/workflow/status?email=${encodeURIComponent(userEmail)}`)

            if (!response.ok) {
              console.error("[v0] Workflow status check failed:", response.status)
              return
            }

            const data = await response.json()
            console.log("[v0] Workflow status response:", data)

            if (data.status === "completed") {
              console.log("[v0] Workflow completed! Ticket created:", data.ticketKey)
              setStatus("completed")
              setMessage("Ticket created successfully!")
              setTicketInfo({
                key: data.ticketKey,
                summary: data.ticketSummary,
              })
              clearInterval(pollInterval)
              clearInterval(timeInterval)
            } else {
              setMessage(data.message || "Ticket is being created, please wait...")
            }
          } catch (error) {
            console.error("[v0] Error polling workflow status:", error)
          }
        }, 10000) // Poll every 10 seconds

        return () => {
          clearInterval(pollInterval)
          clearInterval(timeInterval)
        }
      },
      3 * 60 * 1000,
    ) // 3 minutes = 180,000 ms

    return () => {
      clearTimeout(initialDelay)
      clearInterval(timeInterval)
    }
  }, [isOpen, userEmail])

  const formatElapsedTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleViewTicket = () => {
    if (ticketInfo) {
      window.location.href = `/jira-ticket/${ticketInfo.key}`
    }
  }

  const handleClose = () => {
    if (status === "completed") {
      // Refresh the tickets page
      window.location.href = "/?view=yourTickets"
    } else {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md w-full bg-white">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              {status === "completed" ? (
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              ) : (
                <Mail className="w-8 h-8 text-blue-600" />
              )}
            </div>
          </div>
          <DialogTitle className="text-xl font-semibold text-center text-gray-800">
            {status === "completed" ? "Ticket Created!" : "Creating Your Ticket"}
          </DialogTitle>
        </DialogHeader>

        <DialogDescription className="text-center space-y-4">
          {status === "waiting" && (
            <>
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <p className="text-gray-600 font-medium">{message}</p>
              </div>
              <p className="text-sm text-gray-500">
                We're processing your email and creating your ticket. This usually takes 3-5 minutes.
              </p>
              <p className="text-xs text-gray-400">Elapsed time: {formatElapsedTime(elapsedTime)}</p>
            </>
          )}

          {status === "checking" && (
            <>
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <p className="text-gray-600 font-medium">{message}</p>
              </div>
              <p className="text-sm text-gray-500">Monitoring workflow execution... Your ticket will appear shortly.</p>
              <p className="text-xs text-gray-400">Elapsed time: {formatElapsedTime(elapsedTime)}</p>
            </>
          )}

          {status === "completed" && ticketInfo && (
            <>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800 mb-2">Your ticket has been created successfully!</p>
                <div className="text-left space-y-1">
                  <p className="text-xs text-green-700">
                    <strong>Ticket ID:</strong> {ticketInfo.key}
                  </p>
                  <p className="text-xs text-green-700">
                    <strong>Summary:</strong> {ticketInfo.summary}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-600">You can now view your ticket details and track its progress.</p>
            </>
          )}
        </DialogDescription>

        <div className="flex justify-center mt-4 space-x-3">
          {status === "completed" ? (
            <>
              <Button onClick={handleViewTicket} className="bg-blue-600 hover:bg-blue-700 text-white">
                View Ticket
              </Button>
              <Button onClick={handleClose} variant="outline">
                Close
              </Button>
            </>
          ) : (
            <Button onClick={handleClose} variant="outline">
              Continue in Background
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
