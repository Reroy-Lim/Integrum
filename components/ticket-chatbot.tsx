"use client"

import type React from "react"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Bot, User } from "lucide-react"
import { useEffect, useRef, useState } from "react"

interface TicketChatbotProps {
  ticketKey: string
  ticketTitle: string
  ticketDescription: string
  solutionsSections?: string
}

export function TicketChatbot({ ticketKey, ticketTitle, ticketDescription, solutionsSections }: TicketChatbotProps) {
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const ticketContext = `Ticket: ${ticketKey}\nTitle: ${ticketTitle}\nDescription: ${ticketDescription.substring(0, 500)}...`

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { ticketContext, solutionsSections },
    }),
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || status === "in_progress") return

    sendMessage({ text: input })
    setInput("")
  }

  const formatSolutions = (solutions: string) => {
    if (!solutions) return null

    const lines = solutions.split("\n")
    const sections: { header?: string; content: { type: "numbered" | "text"; number?: number; text: string }[] }[] = []
    let currentSection: { header?: string; content: { type: "numbered" | "text"; number?: number; text: string }[] } = {
      content: [],
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
        if (currentSection.header || currentSection.content.length > 0) {
          sections.push(currentSection)
        }
        // Start new section
        currentSection = { header: trimmedLine, content: [] }
      } else {
        // Check for numbered items (1), 2), 3), etc.)
        const numberedMatch = trimmedLine.match(/^(\d+)\)\s*(.+)/)
        if (numberedMatch) {
          currentSection.content.push({
            type: "numbered",
            number: Number.parseInt(numberedMatch[1]),
            text: numberedMatch[2],
          })
        } else {
          currentSection.content.push({ type: "text", text: trimmedLine })
        }
      }
    }

    // Add the last section
    if (currentSection.header || currentSection.content.length > 0) {
      sections.push(currentSection)
    }

    return sections
  }

  const solutionSections = solutionsSections ? formatSolutions(solutionsSections) : null

  return (
    <div className="flex flex-col h-[600px] bg-gray-900 rounded-lg border border-gray-700">
      <div className="flex items-center gap-2 p-4 border-b border-gray-700">
        <Bot className="w-5 h-5 text-blue-400" />
        <h3 className="font-semibold text-blue-400">Ticket Information Assistant</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {solutionSections && solutionSections.length > 0 && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="max-w-[85%] bg-gray-800 rounded-lg p-4 border border-blue-500/30">
              <div className="space-y-4">
                {solutionSections.map((section, idx) => (
                  <div key={idx} className="space-y-3">
                    {section.header && (
                      <h4 className="font-bold text-blue-400 text-sm mb-3 underline">{section.header}</h4>
                    )}
                    {section.content.length > 0 && (
                      <div className="space-y-2">
                        {section.content.map((item, lineIdx) => {
                          if (item.type === "numbered") {
                            return (
                              <div key={lineIdx} className="flex items-start gap-2">
                                <span className="text-blue-400 text-sm font-semibold flex-shrink-0">
                                  {item.number}.
                                </span>
                                <p className="text-blue-300 text-sm leading-relaxed flex-1">{item.text}</p>
                              </div>
                            )
                          } else {
                            return (
                              <p key={lineIdx} className="text-blue-300 text-sm leading-relaxed">
                                {item.text}
                              </p>
                            )
                          }
                        })}
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
            <p className="text-sm">Ask me anything about this ticket.</p>
            <p className="text-xs mt-2">I can help troubleshoot, suggest solutions, or answer questions.</p>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            {message.role === "assistant" && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
            )}

            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-800 text-blue-300"
              }`}
            >
              {message.parts.map((part, index) => {
                if (part.type === "text") {
                  return (
                    <p key={index} className="text-sm whitespace-pre-wrap leading-relaxed">
                      {part.text}
                    </p>
                  )
                }
                return null
              })}
            </div>

            {message.role === "user" && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-300" />
              </div>
            )}
          </div>
        ))}

        {status === "in_progress" && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
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
            placeholder="Type your message..."
            disabled={status === "in_progress"}
            className="flex-1 bg-gray-800 border-gray-700 text-blue-300 placeholder:text-blue-500/50"
          />
          <Button
            type="submit"
            disabled={!input.trim() || status === "in_progress"}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}
