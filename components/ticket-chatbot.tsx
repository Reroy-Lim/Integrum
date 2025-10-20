"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Send, Bot, User, Headset, Paperclip, X, CheckCircle2 } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

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
}

export function TicketChatbot({
  ticketKey,
  ticketTitle,
  ticketDescription,
  solutionsSections,
  currentUserEmail,
  isMasterAccount,
  ticketStatus,
}: TicketChatbotProps) {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [isResolved, setIsResolved] = useState(
    ticketStatus?.toLowerCase().includes("resolved") || ticketStatus?.toLowerCase().includes("done"),
  )
  const [isResolving, setIsResolving] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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

    pollingIntervalRef.current = setInterval(() => {
      loadMessages()
    }, 5000)

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [ticketKey])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setAttachedFiles((prev) => [...prev, ...files])
  }

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as any)
    }
  }

  const handleResolveTicket = async () => {
    setIsResolving(true)
    try {
      console.log("[v0] Resolving ticket:", ticketKey)
      const response = await fetch(`/api/jira/ticket/${ticketKey}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Done" }),
      })

      if (!response.ok) {
        throw new Error("Failed to resolve ticket")
      }

      console.log("[v0] Ticket resolved successfully")
      setIsResolved(true)
      alert("Ticket has been resolved successfully!")
    } catch (error) {
      console.error("[v0] Error resolving ticket:", error)
      alert("Failed to resolve ticket. Please try again.")
    } finally {
      setIsResolving(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isSending || isResolved) return

    const messageText = input.trim()
    setInput("")
    setAttachedFiles([])
    setIsSending(true)

    try {
      console.log("[v0] Sending message:", {
        ticketKey,
        userEmail: currentUserEmail,
        role: isMasterAccount ? "support" : "user",
        attachments: attachedFiles.length,
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

      if (!isMasterAccount) {
        console.log("[v0] User sent message, updating ticket status to 'In Progress'")
        try {
          const statusResponse = await fetch(`/api/jira/ticket/${ticketKey}/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "In Progress" }),
          })

          if (statusResponse.ok) {
            console.log("[v0] Ticket status updated to 'In Progress'")
          }
        } catch (statusError) {
          console.error("[v0] Error updating ticket status:", statusError)
        }
      }

      await loadMessages()
    } catch (error) {
      console.error("[v0] Error sending message:", error)
      alert("Failed to send message. Please try again.")
      setInput(messageText)
    } finally {
      setIsSending(false)
    }
  }

  const formatSolutions = (solutions: string) => {
    if (!solutions) return null

    const normalizedSolutions = solutions
      .replace(/$$Confidence:\s*\n\s*(\d+(?:\.\d+)?)\s*$$/gi, "(Confidence: $1)")
      .replace(/$$Confidence:\s*(\d+(?:\.\d+)?)\s*\n\s*$$/gi, "(Confidence: $1)")
      .replace(/\(Confidence:\s*\n\s*(\d+(?:\.\d+)?)/gi, "(Confidence: $1")
      .replace(/Confidence:\s*(\d+(?:\.\d+)?)\s*/gi, "(Confidence: $1)")
      .replace(/\(\(Confidence:/gi, "(Confidence:")
      .replace(/\)\)/g, ")")

    const preprocessed = normalizedSolutions
      .replace(/(\d+\))/g, "\n$1")
      .replace(/•/g, "\n•\n")
      .trim()

    const lines = preprocessed.split("\n")
    const sections: { header?: string; items: { type: "numbered" | "bullet"; number?: string; text: string }[] }[] = []
    let currentSection: { header?: string; items: { type: "numbered" | "bullet"; number?: string; text: string }[] } = {
      items: [],
    }

    for (const line of lines) {
      const trimmedLine = line.trim()
      if (!trimmedLine) continue

      if (
        trimmedLine.toLowerCase().startsWith("possible solutions:") ||
        trimmedLine.toLowerCase().startsWith("explanation for solution")
      ) {
        if (currentSection.header || currentSection.items.length > 0) {
          sections.push(currentSection)
        }
        currentSection = { header: trimmedLine, items: [] }
      } else {
        const numberedMatch = trimmedLine.match(/^(\d+)\)\s*(.+)/)
        if (numberedMatch) {
          currentSection.items.push({
            type: "numbered",
            number: numberedMatch[1],
            text: numberedMatch[2],
          })
        } else if (trimmedLine.startsWith("•")) {
          const bulletText = trimmedLine.substring(1).trim()
          if (bulletText) {
            currentSection.items.push({
              type: "bullet",
              text: bulletText,
            })
          }
        } else if (trimmedLine.match(/$$Confidence:\s*\d+(?:\.\d+)?$$/i)) {
          if (currentSection.items.length > 0) {
            const lastItem = currentSection.items[currentSection.items.length - 1]
            lastItem.text += `\n${trimmedLine}`
          }
        } else {
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

    if (currentSection.header || currentSection.items.length > 0) {
      sections.push(currentSection)
    }

    return sections
  }

  const solutionSections = solutionsSections ? formatSolutions(solutionsSections) : null

  return (
    <div className="flex flex-col h-[600px] bg-gray-900 rounded-lg border border-gray-700">
      <div className="flex items-center gap-2 p-4 border-b border-gray-700">
        <Bot className="w-5 h-5 text-blue-400" />
        <h3 className="font-semibold text-blue-400">{isResolved ? "Conversation History" : "Ticket Chat"}</h3>
        <span className="text-xs text-blue-500 ml-auto">{isMasterAccount ? "Support Mode" : "User Mode"}</span>
        {isResolved && (
          <span className="ml-2 text-xs text-green-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Resolved
          </span>
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
            <p className="text-sm">
              {isResolved ? "This ticket has been resolved." : "Start a conversation about this ticket."}
            </p>
            {!isResolved && (
              <p className="text-xs mt-2">
                {isMasterAccount
                  ? "You can respond to the user's questions here."
                  : "Ask questions or provide updates about your issue."}
              </p>
            )}
          </div>
        )}

        {messages.map((message) => {
          const isCurrentUser = message.user_email === currentUserEmail
          const isSupport = message.role === "support"

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
        {!isResolved && (
          <div className="mb-3 flex justify-center">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-green-900/30 border-green-500/30 text-green-400 hover:bg-green-900/50 hover:text-green-300"
                  disabled={isResolving}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Resolve Ticket
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-gray-100 border-gray-300 max-w-sm">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-gray-800 text-center text-base">
                    Resolve this ticket?
                  </AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-row gap-3 justify-center sm:justify-center">
                  <AlertDialogCancel className="bg-gray-200 border-gray-300 text-gray-700 hover:bg-gray-300 m-0 px-8">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleResolveTicket}
                    className="bg-gray-200 border border-gray-300 text-gray-700 hover:bg-gray-300 m-0 px-8"
                  >
                    Resolved
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
        {isResolved && (
          <div className="mb-2 text-center text-sm text-green-400 bg-green-900/20 border border-green-500/30 rounded p-2">
            This ticket has been resolved. No further messages can be sent.
          </div>
        )}
        {attachedFiles.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-xs text-blue-300"
              >
                <Paperclip className="w-3 h-3" />
                <span className="max-w-[150px] truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="hover:text-red-400 transition-colors"
                  disabled={isResolved}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending || isResolved}
            variant="outline"
            className="bg-gray-800 border-gray-700 text-blue-400 hover:bg-gray-700 hover:text-blue-300 disabled:opacity-50"
          >
            <Paperclip className="w-4 h-4" />
          </Button>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isResolved
                ? "Ticket is resolved"
                : isMasterAccount
                  ? "Type your response... (Shift+Enter for new line)"
                  : "Type your message... (Shift+Enter for new line)"
            }
            disabled={isSending || isResolved}
            rows={1}
            className="flex-1 bg-gray-800 border border-gray-700 text-blue-300 placeholder:text-blue-500/50 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: "40px", maxHeight: "120px" }}
          />
          <Button
            type="submit"
            disabled={!input.trim() || isSending || isResolved}
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}
