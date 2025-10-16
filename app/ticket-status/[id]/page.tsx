"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2, CheckCircle, XCircle, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TicketStatusPage() {
  const params = useParams()
  const router = useRouter()
  const pendingTicketId = params.id as string

  const [status, setStatus] = useState<"pending" | "created" | "failed">("pending")
  const [ticketKey, setTicketKey] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/pending-tickets?id=${pendingTicketId}`)

        if (response.ok) {
          const data = await response.json()
          const pendingTicket = data.pendingTicket

          console.log("[v0] Polling ticket status:", pendingTicket.status)

          setStatus(pendingTicket.status)
          setTicketKey(pendingTicket.ticket_key)
          setErrorMessage(pendingTicket.error_message)

          if (pendingTicket.status === "created" || pendingTicket.status === "failed") {
            clearInterval(pollInterval)
          }
        }
      } catch (error) {
        console.error("[v0] Error polling ticket status:", error)
      }
    }, 3000)

    const timeInterval = setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 1000)

    return () => {
      clearInterval(pollInterval)
      clearInterval(timeInterval)
    }
  }, [pendingTicketId])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <Card className="max-w-md w-full bg-gray-900 border-gray-700">
        <CardHeader className="text-center">
          {status === "pending" && (
            <>
              <div className="flex justify-center mb-4">
                <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
              </div>
              <CardTitle className="text-2xl text-white">Creating Your Ticket...</CardTitle>
              <CardDescription className="text-gray-400">
                Please wait while we process your request. This usually takes 5-10 minutes.
              </CardDescription>
            </>
          )}

          {status === "created" && (
            <>
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
              <CardTitle className="text-2xl text-white">Ticket Created Successfully!</CardTitle>
              <CardDescription className="text-gray-400">
                Your ticket has been created and is ready to view.
              </CardDescription>
            </>
          )}

          {status === "failed" && (
            <>
              <div className="flex justify-center mb-4">
                <XCircle className="w-16 h-16 text-red-500" />
              </div>
              <CardTitle className="text-2xl text-white">Ticket Creation Failed</CardTitle>
              <CardDescription className="text-gray-400">
                There was an issue creating your ticket. Please try again.
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {status === "pending" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-900/30 rounded-lg">
                <span className="text-gray-300 text-sm">Elapsed Time:</span>
                <span className="text-blue-400 font-mono font-semibold">{formatTime(elapsedTime)}</span>
              </div>

              <div className="p-4 bg-gray-800 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm text-gray-300">
                      <strong>What's happening:</strong>
                    </p>
                    <ul className="text-xs text-gray-400 space-y-1 ml-4 list-disc">
                      <li>Processing your email</li>
                      <li>Creating Jira ticket</li>
                      <li>Generating AI-powered solutions</li>
                      <li>Sending auto-acknowledgement</li>
                    </ul>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center">
                You can safely close this page. We'll send you an email when your ticket is ready.
              </p>
            </div>
          )}

          {status === "created" && ticketKey && (
            <div className="space-y-3">
              <div className="p-4 bg-green-900/30 border border-green-700 rounded-lg">
                <p className="text-sm text-gray-300 mb-2">
                  <strong>Ticket ID:</strong>
                </p>
                <p className="text-lg text-green-400 font-mono font-semibold">{ticketKey}</p>
              </div>

              <Button
                onClick={() => router.push(`/jira-ticket/${ticketKey}`)}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                View Ticket Details
              </Button>

              <Button
                onClick={() => router.push("/")}
                variant="outline"
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Back to Home
              </Button>
            </div>
          )}

          {status === "failed" && (
            <div className="space-y-3">
              {errorMessage && (
                <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg">
                  <p className="text-sm text-red-400">{errorMessage}</p>
                </div>
              )}

              <Button
                onClick={() => router.push("/submit-ticket")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Try Again
              </Button>

              <Button
                onClick={() => router.push("/")}
                variant="outline"
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Back to Home
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
