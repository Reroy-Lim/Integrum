"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/use-session"
import { Loader2, Mail, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function PendingTicketPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const userEmail = session?.user?.email

  const [elapsedTime, setElapsedTime] = useState(0)
  const [foundTicket, setFoundTicket] = useState(false)
  const [showReopenDialog, setShowReopenDialog] = useState(false)
  const [pendingData, setPendingData] = useState<{ gmailUrl: string; startTime: number } | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const data = localStorage.getItem("pendingTicket")
      if (data) {
        setPendingData(JSON.parse(data))
      }
    }
  }, [])

  useEffect(() => {
    if (foundTicket) return

    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [foundTicket])

  useEffect(() => {
    if (foundTicket || !pendingData) return

    const timeout = setTimeout(() => {
      console.log("[v0] 45 seconds passed without ticket, showing help dialog")
      setShowReopenDialog(true)
    }, 45000) // 45 seconds

    return () => clearTimeout(timeout)
  }, [foundTicket, pendingData])

  useEffect(() => {
    if (!userEmail) return

    const checkForNewTicket = async () => {
      try {
        console.log("[v0] Checking for new tickets for user:", userEmail)

        const response = await fetch(`/api/jira/tickets?email=${encodeURIComponent(userEmail)}&limit=1`)

        if (!response.ok) {
          console.error("[v0] Failed to fetch tickets")
          return
        }

        const data = await response.json()

        if (data.tickets && data.tickets.length > 0) {
          const latestTicket = data.tickets[0]
          const ticketCreatedTime = new Date(latestTicket.created).getTime()
          const currentTime = Date.now()
          const timeDifference = currentTime - ticketCreatedTime

          // Check if ticket was created within last 2 minutes
          if (timeDifference < 2 * 60 * 1000) {
            console.log("[v0] Found new ticket:", latestTicket.key)
            setFoundTicket(true)

            // Clean up localStorage
            if (typeof window !== "undefined") {
              localStorage.removeItem("pendingTicket")
            }

            setTimeout(() => {
              router.push(`/ticket-processing/${latestTicket.key}`)
            }, 1000)
          }
        }
      } catch (error) {
        console.error("[v0] Error checking for new tickets:", error)
      }
    }

    // Initial check after 3 seconds
    const initialTimeout = setTimeout(checkForNewTicket, 3000)

    // Poll every 5 seconds
    const pollInterval = setInterval(checkForNewTicket, 5000)

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(pollInterval)
    }
  }, [userEmail, router, foundTicket])

  const handleReopenGmail = () => {
    if (pendingData?.gmailUrl) {
      console.log("[v0] Reopening Gmail")
      window.open(pendingData.gmailUrl, "_blank")

      // Update start time
      const newData = { ...pendingData, startTime: Date.now() }
      setPendingData(newData)
      if (typeof window !== "undefined") {
        localStorage.setItem("pendingTicket", JSON.stringify(newData))
      }

      setShowReopenDialog(false)
    }
  }

  const handleCancelTicket = () => {
    console.log("[v0] User canceled ticket creation")
    if (typeof window !== "undefined") {
      localStorage.removeItem("pendingTicket")
    }
    router.push("/")
  }

  // Format elapsed time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-white/95 backdrop-blur shadow-2xl">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="flex justify-center">
              <div className="relative">
                <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
                <Mail className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">Ticket is being created...</CardTitle>
            <p className="text-gray-600">Your ticket is being processed. Please be patient.</p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Live Timer */}
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">Processing time</p>
              <p className="text-3xl font-mono font-bold text-blue-600">{formatTime(elapsedTime)}</p>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700 mb-2 font-medium">What's happening?</p>
              <ul className="text-xs text-blue-600 space-y-1">
                <li>• Waiting for your email to arrive</li>
                <li>• Creating ticket in Jira system</li>
                <li>• Analyzing issue with AI</li>
                <li>• Generating auto-acknowledgement</li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                <p className="text-sm text-gray-600">
                  This usually takes 5-10 minutes (Including the time of writing the emails).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showReopenDialog} onOpenChange={setShowReopenDialog}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <AlertDialogTitle className="text-gray-900">Need Help?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-gray-600">
              We haven't received your ticket email yet. Would you like to reopen Gmail to send it, or cancel the ticket
              creation?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleCancelTicket}
              className="bg-transparent border-2 border-border text-foreground hover:bg-secondary/80"
            >
              Cancel Ticket
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReopenGmail}
              className="bg-transparent border-2 border-primary text-white hover:bg-primary/10 hover:border-primary hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all duration-300 hover:scale-105"
            >
              Reopen Gmail
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
