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

const SnowAnimation = () => {
  const snowflakes = Array.from({ length: 50 }, (_, i) => (
    <div
      key={i}
      className="absolute animate-pulse"
      style={{
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 3}s`,
        animationDuration: `${3 + Math.random() * 2}s`,
      }}
    >
      <div
        className="w-3 h-3 bg-white rounded-full opacity-70"
        style={{
          animation: `snowfall ${3 + Math.random() * 2}s linear infinite`,
        }}
      />
    </div>
  ))

  return (
    <>
      <style jsx>{`
        @keyframes snowfall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">{snowflakes}</div>
    </>
  )
}

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
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "In Progress":
        return <Clock className="w-4 h-4 text-blue-500" />
      case "Awaiting Reply":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Resolved":
        return "bg-green-100 text-green-800 border-green-200"
      case "In Progress":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "Awaiting Reply":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black relative">
        <SnowAnimation />
        <div className="flex items-center justify-center min-h-screen relative z-10">
          <div className="text-white text-xl">Loading ticket details...</div>
        </div>
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-black relative">
        <SnowAnimation />
        <div className="flex items-center justify-center min-h-screen relative z-10">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-4">{error || "Ticket not found"}</div>
            <Button onClick={() => router.back()} variant="outline" className="text-white border-white">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black relative">
      <SnowAnimation />

      {/* Header */}
      <nav className="flex items-center justify-between p-6 border-b border-border relative z-10">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.push("/")} className="text-white hover:text-gray-300">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-primary">INTEGRUM</h1>
        </div>
      </nav>

      <div className="py-8 px-6 relative z-10">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Ticket Header */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(ticket.status)}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(ticket.status)}
                        <span>{ticket.status}</span>
                      </div>
                    </Badge>
                  </div>
                  <CardTitle className="text-xl text-gray-900">{ticket.title}</CardTitle>
                  <CardDescription className="text-gray-600">
                    Ticket #{ticket.ticketNumber || ticket.id} • Submitted by {ticket.sender} on{" "}
                    {new Date(ticket.date).toLocaleDateString()}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            {ticket.description && (
              <CardContent>
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">Description</h3>
                  <p className="text-gray-700 leading-relaxed">{ticket.description}</p>
                </div>
              </CardContent>
            )}
          </Card>

          {/* AI Proposed Solutions */}
          {ticket.aiProposedSolution && ticket.aiProposedSolution.length > 0 && (
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-gray-900">
                  <Bot className="w-5 h-5 text-blue-600" />
                  <span>AI Proposed Solutions</span>
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Our AI system has analyzed your issue and suggests the following solutions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {ticket.aiProposedSolution.map((solution, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border border-blue-100">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">Solution {index + 1}</h4>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {solution.confidence}% confidence
                      </Badge>
                    </div>
                    <p className="text-gray-700 mb-2">{solution.solution}</p>
                    <p className="text-sm text-gray-600 italic">{solution.explanation}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Conversation History */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Conversation History</CardTitle>
              <CardDescription className="text-gray-600">
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
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">This ticket has been resolved</span>
                </div>
                <p className="text-sm text-green-600 mt-1">
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
