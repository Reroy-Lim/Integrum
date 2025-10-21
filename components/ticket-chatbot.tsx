"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Send, Bot, User, Headset, X, Paperclip, File } from "lucide-react"
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
  const [showResolveDialog, setShowResolveDialog] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    if ((!input.trim() && selectedFiles.length === 0) || isSending || isResolved) return

    const messageText = input.trim()
    const filesToSend = [...selectedFiles]
    setInput("")
    setSelectedFiles([])
    setIsSending(true)

    try {
      console.log("[v0] Sending message:", {
        ticketKey,
        userEmail: currentUserEmail,
        role: isMasterAccount ? "support" : "user",
        filesCount: filesToSend.length,
      })

      const formData = new FormData()
      formData.append("ticketKey", ticketKey)
      formData.append("userEmail", currentUserEmail)
      formData.append("message", messageText)
      formData.append("role", isMasterAccount ? "support" : "user")

      filesToSend.forEach((file, index) => {
        formData.append(`file_${index}`, file)
      })
      formData.append("fileCount", filesToSend.length.toString())

      const response = await fetch("/api/chat-messages", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      console.log("[v0] Message sent successfully")

      await loadMessages()
    } catch (error) {
      console.error("[v0] Error sending message:", error)
      alert("Failed to send message. Please try again.")
      setInput(messageText)
      setSelectedFiles(filesToSend)
    } finally {
      setIsSending(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files])
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAttachClick = () => {
    fileInputRef.current?.click()
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

  const handleResolveTicket = async () => {
    try {
      console.log("[v0] Resolving ticket:", ticketKey)
      // TODO: Implement actual resolve ticket API call
      // const response = await fetch(`/api/tickets/${ticketKey}/resolve`, {
      //   method: 'POST',
      // })
      // if (!response.ok) throw new Error('Failed to resolve ticket')

      setShowResolveDialog(false)
      alert("Ticket resolved successfully!")
    } catch (error) {
      console.error("[v0] Error resolving ticket:", error)
      alert("Failed to resolve ticket. Please try again.")
    }
  }

  const isResolved = ticketStatus?.toLowerCase().includes("resolved") || ticketStatus?.toLowerCase().includes("done")

  return (
    <>
      <div className="flex flex-col h-[600px] bg-gray-900 rounded-lg border border-gray-700">
        <div className="flex items-center gap-2 p-4 border-b border-gray-700">
          <Bot className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-blue-400">Ticket Chat</h3>
          <span className="text-xs text-blue-500 ml-auto">{isMasterAccount ? "Support Mode" : "User Mode"}</span>
          {isResolved ? (
            <div className="ml-2 px-3 py-1.5 bg-cyan-500 rounded-md flex items-center gap-2">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
              >
                <path
                  d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-white text-sm font-medium">Resolved</span>
            </div>
          ) : (
            <button
              onClick={() => setShowResolveDialog(true)}
              className="ml-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-md border border-green-500/30 flex items-center gap-2 transition-colors"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
              >
                <circle cx="12" cy="12" r="10" fill="#22C55E" />
                <path
                  d="M7 12L10.5 15.5L17 9"
                  stroke="#000000"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-white text-sm">Resolve Ticket</span>
            </button>
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

            const displayName = message.author_name || message.user_email.split("@")[0]

            return (
              <div key={message.id} className={`flex gap-3 ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                {!isCurrentUser && (
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      isSupport ? "bg-green-600" : "bg-gray-700"
                    }`}
                  >
                    {isSupport ? (
                      <Headset className="w-5 h-5 text-white" />
                    ) : (
                      <User className="w-5 h-5 text-gray-300" />
                    )}
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

        {isResolved && (
          <div className="mx-4 mb-4 p-4 bg-green-900/30 border border-green-500/50 rounded-lg">
            <div className="flex items-start gap-3">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6 flex-shrink-0 mt-0.5"
              >
                <path
                  d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                  stroke="#22C55E"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex-1">
                <h4 className="text-green-400 font-semibold mb-1">This ticket has been Resolved</h4>
                <p className="text-green-300 text-sm leading-relaxed">
                  If you wish to continue, Please resubmit another ticket and provide the ticket number inside the chat.
                  Our live agent will get back to you asap!
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
          {selectedFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm"
                >
                  <File className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-300 max-w-[150px] truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
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
              accept="*/*"
            />

            <Button
              type="button"
              onClick={handleAttachClick}
              disabled={isSending || isResolved}
              variant="outline"
              className="bg-gray-800 border-gray-700 text-blue-400 hover:bg-gray-700 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Paperclip className="w-4 h-4" />
            </Button>

            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isResolved
                  ? "This ticket has been resolved"
                  : isMasterAccount
                    ? "Type your response... (Shift+Enter for new line)"
                    : "Type your message... (Shift+Enter for new line)"
              }
              disabled={isSending || isResolved}
              className="flex-1 bg-gray-800 border-gray-700 text-blue-300 placeholder:text-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !isResolved) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
            />
            <Button
              type="submit"
              disabled={(!input.trim() && selectedFiles.length === 0) || isSending || isResolved}
              className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </div>

      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent className="bg-gray-800 border-gray-700 max-w-md">
          <button
            onClick={() => setShowResolveDialog(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4 text-gray-400" />
            <span className="sr-only">Close</span>
          </button>
          <DialogHeader>
            <DialogTitle className="text-white text-xl text-center">Confirm to Resolve the Tickets?</DialogTitle>
            <DialogDescription className="text-gray-400 text-center pt-2">
              This will mark the ticket as resolved and disable further chat messages. This action cannot be undo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 sm:justify-center pt-4">
            <Button
              variant="outline"
              onClick={() => setShowResolveDialog(false)}
              className="bg-transparent border-gray-600 text-white hover:bg-gray-700 px-6"
            >
              Cancel
            </Button>
            <Button onClick={handleResolveTicket} className="bg-cyan-500 hover:bg-cyan-600 text-white px-6">
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
