"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/use-session"
import { Loader2, Mail, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function PendingTicketPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const userEmail = session?.user?.email

  const [elapsedTime, setElapsedTime] = useState(0)
  const [foundTicket, setFoundTicket] = useState(false)

  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [hasLeftPage, setHasLeftPage] = useState(false)
  const [timeBackOnPage, setTimeBackOnPage] = useState(0)

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User left the page (switched to Gmail tab)
        console.log("[v0] User left the page")
        setHasLeftPage(true)
        setTimeBackOnPage(0)
      } else {
        // User returned to the page
        console.log("[v0] User returned to the page")
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  useEffect(() => {
    if (foundTicket || !hasLeftPage || document.hidden) return

    const timer = setInterval(() => {
      setTimeBackOnPage((prev) => {
        const newTime = prev + 1
        // Show confirmation dialog after 15 seconds of being back on page
        if (newTime === 15) {
          setShowConfirmDialog(true)
        }
        return newTime
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [hasLeftPage, foundTicket])

  useEffect(() => {
    if (foundTicket) return

    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [foundTicket])

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

          if (timeDifference < 2 * 60 * 1000) {
            console.log("[v0] Found new ticket:", latestTicket.key)
            setFoundTicket(true)

            setTimeout(() => {
              router.push(`/ticket-processing/${latestTicket.key}`)
            }, 1000)
          }
        }
      } catch (error) {
        console.error("[v0] Error checking for new tickets:", error)
      }
    }

    const initialTimeout = setTimeout(checkForNewTicket, 3000)
    const pollInterval = setInterval(checkForNewTicket, 5000)

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(pollInterval)
    }
  }, [userEmail, router])

  const handleEmailSent = () => {
    setShowConfirmDialog(false)
    setHasLeftPage(false)
    setTimeBackOnPage(0)
  }

  const handleEmailNotSent = () => {
    setShowConfirmDialog(false)
    router.push("/")
  }

  const handleRetry = () => {
    setShowConfirmDialog(false)
    router.push("/submit-ticket")
  }

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
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">Processing time</p>
              <p className="text-3xl font-mono font-bold text-blue-600">{formatTime(elapsedTime)}</p>
            </div>

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

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <DialogTitle>Did you send the email?</DialogTitle>
            </div>
            <DialogDescription className="pt-2">
              We noticed you returned to this page. Please confirm if you sent the email to create your support ticket.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button
              onClick={handleEmailSent}
              className="w-full bg-transparent border-2 border-primary text-white hover:bg-primary hover:text-white hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all duration-300"
            >
              Yes, I sent the email
            </Button>
            <Button
              onClick={handleRetry}
              variant="outline"
              className="w-full bg-transparent border-2 border-border text-white hover:bg-primary hover:border-primary hover:text-white hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all duration-300"
            >
              No, let me try again
            </Button>
            <Button
              onClick={handleEmailNotSent}
              variant="ghost"
              className="w-full text-foreground/80 hover:text-primary hover:bg-secondary/50 transition-all duration-200"
            >
              Cancel and go back home
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
