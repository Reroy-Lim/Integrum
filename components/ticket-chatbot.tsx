"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Bot, User, Headset, CheckCircle2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"

interface ChatMessage {
  id: string
  ticket_key: string
  user_email: string
  author_name?: string
  message: string
  role: "user" | "support"
  created_at: string
}

interface TicketChatbotProps {
  ticketKey: string
  ticketTitle: string
  ticketDescription: string
  solutionsSections?: string
  currentUserEmail: string
  isMasterAccount: boolean
  ticketStatus?: string
  onResolveTicket?: () => void
}

export function TicketChatbot({
  ticketKey,
  ticketTitle,
  ticketDescription,
  solutionsSections,
  currentUserEmail,
  isMasterAccount,
  ticketStatus,
  onResolveTicket,
}: TicketChatbotProps) {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadMessages = async () => {
    try {
      console.log("[v0] Loading chat messages for ticket:", ticketKey)
      const response = await fetch(`/api/chat-messages?ticketKey=${ticketKey}`)
      if (!response.ok) {
        throw new Error("Failed to load messages")
      }
      const data = await response.json()
      console.log("[v0] Loaded", data.messages?.length || 0, "messages")
      setMessages(data.messages || [])
    } catch (error) {
      console.error("[v0] Error loading messages:", error)
    }
  }

  useEffect(() => {
    loadMessages()

    // Poll for new messages every 5 seconds
    pollingIntervalRef.current = setInterval(() => {
      loadMessages()
    }, 5000)

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [ticketKey])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isSending) return

    const messageText = input.trim()
    setInput("")
    setIsSending(true)

    try {
      console.log("[v0] Sending message:", {
        ticketKey,
        userEmail: currentUserEmail,
        role: isMasterAccount ? "support" : "user",
      })

      const response = await fetch("/api/chat-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketKey,
          userEmail: currentUserEmail,
          message: messageText,
          role: isMasterAccount ? "support" : "user",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      console.log("[v0] Message sent successfully")

      // Reload messages immediately after sending
      await loadMessages()
    } catch (error) {
      console.error("[v0] Error sending message:", error)
      alert("Failed to send message. Please try again.")
      setInput(messageText) // Restore the message
    } finally {
      setIsSending(false)
    }
  }

  const formatSolutions = (solutions: string) => {
    if (!solutions) return null

    // First, normalize and fix split confidence patterns
    const normalizedSolutions = solutions
      // Join split confidence patterns like "(Confidence:\n88)" or "(Confidence:\n88) .5"
      .replace(/$$Confidence:\s*\n\s*(\d+(?:\.\d+)?)\s*$$/gi, "(Confidence: $1)")
      // Handle cases where closing paren is on next line: "(Confidence: 88\n)"
      .replace(/$$Confidence:\s*(\d+(?:\.\d+)?)\s*\n\s*$$/gi, "(Confidence: $1)")
      // Handle cases where number is on next line: "(Confidence:\n88"
      .replace(/\(Confidence:\s*\n\s*(\d+(?:\.\d+)?)/gi, "(Confidence: $1")
      // Ensure all confidence patterns have parentheses
      .replace(/Confidence:\s*(\d+(?:\.\d+)?)\s*/gi, "(Confidence: $1)")
      // Remove double parentheses if any
      .replace(/\(\(Confidence:/gi, "(Confidence:")
      .replace(/\)\)/g, ")")

    // Preprocess: Add line breaks before numbered items and bullet points
    const preprocessed = normalizedSolutions
      .replace(/(\d+\))/g, "\n$1") // Add line break before numbered items
      .replace(/•/g, "\n•\n") // Add line breaks before and after bullets
      .trim()

    const lines = preprocessed.split("\n")
    const sections: { header?: string; items: { type: "numbered" | "bullet"; number?: string; text: string }[] }[] = []
    let currentSection: { header?: string; items: { type: "numbered" | "bullet"; number?: string; text: string }[] } = {
      items: [],
    }

    for (const line of lines) {
      const trimmedLine = line.trim()
      if (!trimmedLine) continue

      // Check if line is a section header
      if (
        trimmedLine.toLowerCase().startsWith("possible solutions:") ||
        trimmedLine.toLowerCase().startsWith("explanation for solution")
      ) {
        // Save previous section if it has content
        if (currentSection.header || currentSection.items.length > 0) {
          sections.push(currentSection)
        }
        // Start new section
        currentSection = { header: trimmedLine, items: [] }
      } else {
        // Check for numbered item (1), 2), 3), etc.)
        const numberedMatch = trimmedLine.match(/^(\d+)\)\s*(.+)/)
        if (numberedMatch) {
          currentSection.items.push({
            type: "numbered",
            number: numberedMatch[1],
            text: numberedMatch[2],
          })
        }
        // Check for bullet point
        else if (trimmedLine.startsWith("•")) {
          const bulletText = trimmedLine.substring(1).trim()
          if (bulletText) {
            currentSection.items.push({
              type: "bullet",
              text: bulletText,
            })
          }
        } else if (trimmedLine.match(/$$Confidence:\s*\d+(?:\.\d+)?$$/i)) {
          // Append to the last item if it exists
          if (currentSection.items.length > 0) {
            const lastItem = currentSection.items[currentSection.items.length - 1]
            lastItem.text += `\n${trimmedLine}`
          }
        } else {
          // Append to the last item if it exists, otherwise add as new item
          if (currentSection.items.length > 0) {
            const lastItem = currentSection.items[currentSection.items.length - 1]
            lastItem.text += ` ${trimmedLine}`
          } else {
            currentSection.items.push({
              type: "bullet",
              text: trimmedLine,
            })
          }
        }
      }
    }

    // Add the last section
    if (currentSection.header || currentSection.items.length > 0) {
      sections.push(currentSection)
    }

    return sections
  }

  const solutionSections = solutionsSections ? formatSolutions(solutionsSections) : null

  console.log("[v0] Ticket status:", ticketStatus)
  console.log("[v0] Ticket status lowercase:", ticketStatus?.toLowerCase())

  const showResolveButton =
    ticketStatus &&
    !ticketStatus.toLowerCase().includes("resolved") &&
    !ticketStatus.toLowerCase().includes("done") &&
    !ticketStatus.toLowerCase().includes("closed")

  console.log("[v0] Show resolve button:", showResolveButton)

  return (
    <div className="flex flex-col h-[600px] bg-gray-900 rounded-lg border border-gray-700">
      <div className="flex items-center gap-2 p-4 border-b border-gray-700">
        <Bot className="w-5 h-5 text-blue-400" />
        <h3 className="font-semibold text-blue-400">Ticket Chat</h3>
        <span className="text-xs text-blue-500 ml-auto">{isMasterAccount ? "Support Mode" : "User Mode"}</span>

        {showResolveButton && (
          <Button
            onClick={() => {
              console.log("[v0] Resolve button clicked")
              onResolveTicket?.()
            }}
            className="ml-2 bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1.5 h-auto flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            Resolve Ticket
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {solutionSections && solutionSections.length > 0 && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="max-w-[85%] bg-gray-800 rounded-lg p-4 border border-blue-500/30">
              <div className="space-y-6">
                {solutionSections.map((section, idx) => (
                  <div key={idx} className="space-y-3">
                    {section.header && <h4 className="font-bold text-blue-400 text-sm mb-3">{section.header}</h4>}
                    {section.items.length > 0 && (
                      <div className="space-y-4">
                        {section.items.map((item, itemIdx) => (
                          <div key={itemIdx} className="flex items-start gap-2">
                            {item.type === "numbered" ? (
                              <>
                                <span className="text-blue-400 text-sm mt-0.5 flex-shrink-0 font-medium">
                                  {item.number})
                                </span>
                                <p className="text-blue-300 text-sm leading-relaxed flex-1 whitespace-pre-line">
                                  {item.text}
                                </p>
                              </>
                            ) : (
                              <>
                                <span className="text-blue-400 text-sm mt-0.5 flex-shrink-0">•</span>
                                <p className="text-blue-300 text-sm leading-relaxed flex-1 whitespace-pre-line">
                                  {item.text}
                                </p>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.length === 0 && !solutionSections && (
          <div className="flex flex-col items-center justify-center h-full text-center text-blue-400">
            <Bot className="w-12 h-12 mb-4 text-blue-500" />
            <p className="text-sm">Start a conversation about this ticket.</p>
            <p className="text-xs mt-2">
              {isMasterAccount
                ? "You can respond to the user's questions here."
                : "Ask questions or provide updates about your issue."}
            </p>
          </div>
        )}

        {messages.map((message) => {
          const isCurrentUser = message.user_email === currentUserEmail
          const isSupport = message.role === "support"

          // Determine display name
          const displayName = message.author_name || message.user_email.split("@")[0]

          return (
            <div key={message.id} className={`flex gap-3 ${isCurrentUser ? "justify-end" : "justify-start"}`}>
              {!isCurrentUser && (
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    isSupport ? "bg-green-600" : "bg-gray-700"
                  }`}
                >
                  {isSupport ? <Headset className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-gray-300" />}
                </div>
              )}

              <div className="flex flex-col gap-1">
                {!isCurrentUser && <span className="text-xs text-gray-400 px-1">{displayName}</span>}

                <div
                  className={`rounded-lg p-3 ${
                    isCurrentUser
                      ? "bg-blue-600 text-white"
                      : isSupport
                        ? "bg-green-900/30 text-green-300 border border-green-500/30"
                        : "bg-gray-800 text-blue-300"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.message}</p>
                  <p className="text-xs mt-1 opacity-60">
                    {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>

              {isCurrentUser && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          )
        })}

        {isSending && (
          <div className="flex gap-3 justify-end">
            <div className="bg-blue-600/50 rounded-lg p-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isMasterAccount ? "Type your response..." : "Type your message..."}
            disabled={isSending}
            className="flex-1 bg-gray-800 border-gray-700 text-blue-300 placeholder:text-blue-500/50"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isSending}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}
