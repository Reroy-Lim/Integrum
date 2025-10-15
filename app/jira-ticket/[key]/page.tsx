"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "@/lib/use-session"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowLeft, Calendar, User, AlertCircle, Mail } from "@/components/icons"
import { Badge } from "@/components/ui/badge"
import type { JiraTicket } from "@/lib/jira-api"

export default function JiraTicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const ticketKey = params.key as string
  const { data: session } = useSession()
  const userEmail = session?.user?.email || ""
  const isMasterAccount = userEmail === "heyroy23415@gmail.com"

  const [ticket, setTicket] = useState<JiraTicket | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTicket = async () => {
      if (!ticketKey) return

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/jira/ticket/${ticketKey}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch ticket: ${response.statusText}`)
        }

        const data = await response.json()
        setTicket(data.ticket)
      } catch (error) {
        console.error("Error fetching ticket:", error)
        setError(error instanceof Error ? error.message : "Failed to fetch ticket")
      } finally {
        setIsLoading(false)
      }
    }

    fetchTicket()
  }, [ticketKey])

  const extractEmailFromDescription = (description: string): string | null => {
    // Use the same pattern as in jira-api.ts for consistency
    const patterns = [
      /From:\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,6})(?=[A-Z]|\s|$|[^a-zA-Z0-9])/,
      /from:\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,6})(?=[A-Z]|\s|$|[^a-zA-Z0-9])/,
      /FROM:\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,6})(?=[A-Z]|\s|$|[^a-zA-Z0-9])/,
    ]

    for (const pattern of patterns) {
      const match = description.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }

    return null
  }

  const cleanDescription = (description: string): string => {
    if (!description) return ""

    // Remove the "From: [email]" line (case-insensitive)
    const cleaned = description.replace(/^From:\s*[^\n]+\n?/i, "")
    return cleaned.trim()
  }

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase()
    if (statusLower.includes("progress") || statusLower.includes("development")) {
      return "bg-yellow-500"
    }
    if (statusLower.includes("done") || statusLower.includes("resolved")) {
      return "bg-green-500"
    }
    if (statusLower.includes("waiting") || statusLower.includes("pending")) {
      return "bg-blue-500"
    }
    return "bg-gray-500"
  }

  const getPriorityColor = (priority: string) => {
    const priorityLower = priority.toLowerCase()
    if (priorityLower.includes("highest") || priorityLower.includes("critical")) {
      return "bg-red-500"
    }
    if (priorityLower.includes("high")) {
      return "bg-orange-500"
    }
    if (priorityLower.includes("medium")) {
      return "bg-yellow-500"
    }
    return "bg-blue-500"
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
          <h3 className="text-xl font-semibold text-white mb-2">Loading Ticket Details...</h3>
          <p className="text-gray-400">Fetching ticket information from Jira</p>
        </div>
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <Card className="max-w-md w-full bg-red-50 border-red-200">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <div>
                <CardTitle className="text-red-800">Error Loading Ticket</CardTitle>
                <CardDescription className="text-red-600">{error || "Ticket not found"}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const customerEmail = extractEmailFromDescription(ticket.description || "")
  const displayDescription = cleanDescription(ticket.description || "")

  return (
    <div className="min-h-screen bg-black">
      <nav className="flex items-center justify-between p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-white">INTEGRUM</h1>
        <Button variant="outline" onClick={() => router.push("/?view=yourTickets")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Your Tickets
        </Button>
      </nav>

      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Badge variant="outline" className="text-blue-400 border-blue-400">
                      {ticket.key}
                    </Badge>
                    <Badge className={`${getStatusColor(ticket.status.name)} text-white`}>{ticket.status.name}</Badge>
                    <Badge className={`${getPriorityColor(ticket.priority.name)} text-white`}>
                      {ticket.priority.name}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl text-white mb-2">{ticket.summary}</CardTitle>
                  <CardDescription className="text-gray-400">{ticket.issuetype.name}</CardDescription>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div className="flex items-center space-x-3 text-gray-300">
                  <User className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-xs text-gray-500">Reporter</p>
                    <p className="font-medium">{ticket.reporter.displayName}</p>
                    <p className="text-sm text-gray-400">{ticket.reporter.emailAddress}</p>
                  </div>
                </div>

                {ticket.assignee && (
                  <div className="flex items-center space-x-3 text-gray-300">
                    <User className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-xs text-gray-500">Assignee</p>
                      <p className="font-medium">{ticket.assignee.displayName}</p>
                      <p className="text-sm text-gray-400">{ticket.assignee.emailAddress}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3 text-gray-300">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="text-xs text-gray-500">Created</p>
                    <p className="font-medium">{new Date(ticket.created).toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-gray-300">
                  <Calendar className="w-5 h-5 text-yellow-400" />
                  <div>
                    <p className="text-xs text-gray-500">Last Updated</p>
                    <p className="font-medium">{new Date(ticket.updated).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {!isMasterAccount && customerEmail && (
                <div className="p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-xs text-blue-300">Customer Email</p>
                      <p className="font-medium text-blue-200">{customerEmail}</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
                <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                  <p className="text-gray-300 whitespace-pre-wrap">{displayDescription || "No description provided"}</p>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button variant="outline" onClick={() => router.push("/?view=yourTickets")} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Your Tickets
                </Button>
                <Button
                  onClick={() => window.open(`${process.env.NEXT_PUBLIC_JIRA_BASE_URL}/browse/${ticket.key}`, "_blank")}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  View in Jira
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
