"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2, CheckCircle2, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TicketProcessingPage() {
  const params = useParams()
  const router = useRouter()
  const ticketId = params.ticketId as string

  const [status, setStatus] = useState<"processing" | "done" | "error">("processing")
  const [elapsedTime, setElapsedTime] = useState(0)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    if (status !== "processing") return

    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [status])

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/ticket-status/${ticketId}`)
        const data = await response.json()

        if (data.status === "done") {
          setStatus("done")
        } else if (data.status === "error") {
          setStatus("error")
          setErrorMessage(data.message || "Failed to create ticket")
        }
      } catch (error) {
        console.error("[v0] Error checking ticket status:", error)
      }
    }

    // Initial check
    checkStatus()

    // Poll every 3 seconds
    const pollInterval = setInterval(checkStatus, 3000)

    return () => clearInterval(pollInterval)
  }, [ticketId])

  // Format elapsed time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleViewDashboard = () => {
    router.push("/?view=yourTickets")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950 flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-card border-2 border-border shadow-2xl">
        <CardHeader className="text-center space-y-4 pb-6">
          {status === "processing" && (
            <>
              <div className="flex justify-center">
                <div className="relative">
                  <Loader2 className="w-16 h-16 text-primary animate-spin" />
                  <Mail className="w-8 h-8 text-accent absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">Ticket is being created...</CardTitle>
              <p className="text-muted-foreground">Your ticket is being processed. Please be patient.</p>
            </>
          )}

          {status === "done" && (
            <>
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">Ticket Successfully Created!</CardTitle>
              <p className="text-muted-foreground">You may now view it on your dashboard.</p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center">
                  <Mail className="w-10 h-10 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">Processing Error</CardTitle>
              <p className="text-muted-foreground">{errorMessage}</p>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Live Timer */}
          <div className="bg-secondary rounded-lg p-4 text-center border border-border">
            <p className="text-sm text-muted-foreground mb-1">Processing time</p>
            <p className="text-3xl font-mono font-bold text-primary">{formatTime(elapsedTime)}</p>
          </div>

          {/* Ticket ID */}
          <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-4">
            <p className="text-sm text-primary mb-1">Ticket ID</p>
            <p className="text-lg font-semibold text-foreground">{ticketId}</p>
          </div>

          {/* Status Messages */}
          {status === "processing" && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                <p className="text-sm text-gray-600">Creating ticket in system...</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                <p className="text-sm text-gray-600">Analyzing issue with AI...</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                <p className="text-sm text-gray-600">Generating auto-acknowledgement...</p>
              </div>
            </div>
          )}

          {status === "done" && (
            <Button
              onClick={handleViewDashboard}
              className="w-full bg-primary hover:bg-accent text-primary-foreground transition-all duration-300"
            >
              View Dashboard
            </Button>
          )}

          {status === "error" && (
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="w-full border-border hover:bg-secondary"
            >
              Back to Home
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Optional Debug Console (for monitoring only) */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono max-w-sm">
          <p>Status: {status}</p>
          <p>Ticket ID: {ticketId}</p>
          <p>Elapsed: {formatTime(elapsedTime)}</p>
        </div>
      )}
    </div>
  )
}
