"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Bot, CheckCircle, Clock, AlertCircle } from "lucide-react"
import type { Ticket } from "@/lib/types"
import { ConversationHistory } from "@/components/conversation-history"
import { ReplyInterface } from "@/components/reply-interface"

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const ticketId = params.id as string

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTicketDetails()
  }, [ticketId])

  const fetchTicketDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tickets/${ticketId}`)
      const data = await response.json()

      if (data.success) {
        setTicket(data.ticket)
      } else {
        setError(data.error || "Failed to fetch ticket details")
      }
    } catch (err) {
      setError("Network error occurred")
      console.error("Error fetching ticket:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleReplySubmitted = (newConversation: any) => {
    if (ticket) {
      setTicket({
        ...ticket,
        conversations: [...(ticket.conversations || []), newConversation],
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Resolved":
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case "In Progress":
        return <Clock className="w-4 h-4 text-blue-400" />
      case "Awaiting Reply":
        return <AlertCircle className="w-4 h-4 text-yellow-400" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Resolved":
        return "bg-green-500/20 text-green-300 border-green-500/50"
      case "In Progress":
        return "bg-blue-500/20 text-blue-300 border-blue-500/50"
      case "Awaiting Reply":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/50"
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/50"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950 relative">
        <div className="flex items-center justify-center min-h-screen relative z-10">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="text-foreground text-xl">Loading ticket details...</div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950 relative">
        <div className="flex items-center justify-center min-h-screen relative z-10">
          <div className="text-center space-y-4">
            <div className="text-red-400 text-xl mb-4">{error || "Ticket not found"}</div>
            <Button
              onClick={() => router.back()}
              className="bg-card hover:bg-card/80 text-foreground border-2 border-border transition-all duration-300"
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950 relative">
      <nav className="flex items-center justify-between p-6 border-b-2 border-border/50 backdrop-blur-sm bg-card/5 relative z-10">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/")}
            className="text-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            INTEGRUM
          </h1>
        </div>
      </nav>

      <div className="py-8 px-6 relative z-10">
        <div className="max-w-6xl mx-auto space-y-6">
          <Card className="bg-card/50 backdrop-blur-sm border-2 border-border hover:border-primary/50 transition-all duration-300">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Badge className={`${getStatusColor(ticket.status)} border-2`}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(ticket.status)}
                        <span>{ticket.status}</span>
                      </div>
                    </Badge>
                  </div>
                  <CardTitle className="text-xl text-foreground">{ticket.title}</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Ticket #{ticket.ticketNumber || ticket.id} • Submitted by {ticket.sender} on{" "}
                    {new Date(ticket.date).toLocaleDateString()}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            {ticket.description && (
              <CardContent>
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">Description</h3>
                  <p className="text-muted-foreground leading-relaxed">{ticket.description}</p>
                </div>
              </CardContent>
            )}
          </Card>

          {ticket.aiProposedSolution && ticket.aiProposedSolution.length > 0 && (
            <Card className="bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10 backdrop-blur-sm border-2 border-primary/30 hover:border-primary/50 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-foreground">
                  <Bot className="w-5 h-5 text-primary" />
                  <span>AI Proposed Solutions</span>
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Our AI system has analyzed your issue and suggests the following solutions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {ticket.aiProposedSolution.map((solution, index) => (
                  <div
                    key={index}
                    className="bg-card/70 backdrop-blur-sm rounded-lg p-4 border-2 border-border hover:border-accent/50 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-foreground">Solution {index + 1}</h4>
                      <Badge className="bg-accent/20 text-accent border-2 border-accent/50">
                        {solution.confidence}% confidence
                      </Badge>
                    </div>
                    <p className="text-foreground mb-2">{solution.solution}</p>
                    <p className="text-sm text-muted-foreground italic">{solution.explanation}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="bg-card/50 backdrop-blur-sm border-2 border-border hover:border-primary/50 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-foreground">Conversation History</CardTitle>
              <CardDescription className="text-muted-foreground">
                Communication between you and our helpdesk team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConversationHistory conversations={ticket.conversations || []} className="max-h-96 overflow-y-auto" />
            </CardContent>
          </Card>

          {/* Reply Interface */}
          <ReplyInterface
            ticketId={ticketId}
            onReplySubmitted={handleReplySubmitted}
            disabled={ticket.status === "Resolved"}
          />

          {ticket.status === "Resolved" && (
            <Card className="bg-green-500/10 backdrop-blur-sm border-2 border-green-500/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 text-green-300">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">This ticket has been resolved</span>
                </div>
                <p className="text-sm text-green-400/80 mt-1">
                  If you need further assistance, please submit a new ticket.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
