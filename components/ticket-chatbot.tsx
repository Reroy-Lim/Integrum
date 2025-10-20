"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Send, Bot, User, Headset, Paperclip, X, TicketCheck } from "lucide-react"
import { useEffect, useRef, useState } from "react"
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
}

export function TicketChatbot({
  ticketKey,
  ticketTitle,
  ticketDescription,
  solutionsSections,
  currentUserEmail,
  isMasterAccount,
}: TicketChatbotProps) {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [isResolved, setIsResolved] = useState(false)
  const [showResolveDialog, setShowResolveDialog] = useState(false)
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
    // Shift+Enter will naturally create a line break
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isSending) return

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

  const handleResolveTicket = async () => {
    setIsResolving(true)
    try {
      console.log("[v0] Resolving ticket:", ticketKey)
      const response = await fetch("/api/jira/resolve-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketKey }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to resolve ticket")
      }

      console.log("[v0] Ticket resolved successfully")
      setIsResolved(true)
      setShowResolveDialog(false)
    } catch (error) {
      console.error("[v0] Error resolving ticket:", error)
      alert(error instanceof Error ? error.message : "Failed to resolve ticket. Please try again.")
    } finally {
      setIsResolving(false)
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

  return (
    <div className="flex flex-col h-[600px] bg-gray-900 rounded-lg border border-gray-700">
      <div className="flex items-center gap-2 p-4 border-b border-gray-700">
        <Bot className="w-5 h-5 text-blue-400" />
        <h3 className="font-semibold text-blue-400">Ticket Chat</h3>
        <div className="ml-auto flex items-center gap-2">
          {!isMasterAccount && !isResolved && (
            <Button
              onClick={() => setShowResolveDialog(true)}
              size="sm"
              variant="outline"
              className="bg-green-900/30 border-green-500/50 text-green-400 hover:bg-green-900/50 hover:text-green-300"
            >
              <TicketCheck className="w-4 h-4 mr-2" />
              Resolved
            </Button>
          )}
          <span className="text-xs text-blue-500">
            {isResolved ? "Resolved Mode" : isMasterAccount ? "Support Mode" : "User Mode"}
          </span>
        </div>
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

      {isResolved ? (
        <div className="p-4 border-t border-gray-700 bg-gray-800">
          <div className="text-center py-4">
            <TicketCheck className="w-8 h-8 text-green-400 mx-auto mb-3" />
            <p className="text-sm text-gray-300 leading-relaxed">
              This ticket has been Resolved. If you wish to continue, Please resubmit another ticket and provide the
              ticket number inside the chat. Our live agent will get back to you asap!
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
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
              disabled={isSending}
              variant="outline"
              className="bg-gray-800 border-gray-700 text-blue-400 hover:bg-gray-700 hover:text-blue-300"
            >
              <Paperclip className="w-4 h-4" />
            </Button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isMasterAccount
                  ? "Type your response... (Shift+Enter for new line)"
                  : "Type your message... (Shift+Enter for new line)"
              }
              disabled={isSending}
              rows={1}
              className="flex-1 bg-gray-800 border border-gray-700 text-blue-300 placeholder:text-blue-500/50 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ minHeight: "40px", maxHeight: "120px" }}
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
      )}

      <AlertDialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <AlertDialogContent className="bg-gray-900 border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirm to Resolved?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to mark this ticket as resolved? This action will close the ticket and disable
              further chat messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
              disabled={isResolving}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResolveTicket}
              disabled={isResolving}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isResolving ? "Resolving..." : "Resolved"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
