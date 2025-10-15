"use client"

import type React from "react"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Bot, User, Lightbulb, Wrench } from "lucide-react"
import { useEffect, useRef, useState } from "react"

interface TicketChatbotProps {
  ticketKey: string
  ticketTitle: string
  ticketDescription: string
  explanations?: Array<{ text: string; confidence: number }>
  solutions?: string[]
}

export function TicketChatbot({
  ticketKey,
  ticketTitle,
  ticketDescription,
  explanations = [],
  solutions = [],
}: TicketChatbotProps) {
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const ticketContext = `Ticket: ${ticketKey}\nTitle: ${ticketTitle}\nDescription: ${ticketDescription.substring(0, 500)}...`

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { ticketContext },
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

  return (
    <div className="flex flex-col h-[600px] bg-gray-900 rounded-lg border border-gray-700">
      <div className="flex items-center gap-2 p-4 border-b border-gray-700">
        <Bot className="w-5 h-5 text-blue-400" />
        <h3 className="font-semibold text-white">AI Support Assistant</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {explanations.length > 0 && (
          <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border border-blue-700/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-yellow-400" />
              <h4 className="font-semibold text-white text-sm">AI Analysis & Recommendations</h4>
            </div>

            {explanations.map((explanation, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-start gap-3">
                  <span className="text-blue-400 font-semibold text-sm mt-0.5">{idx + 1})</span>
                  <p className="text-gray-200 text-sm leading-relaxed flex-1">{explanation.text}</p>
                </div>
                {explanation.confidence > 0 && (
                  <div className="ml-6 flex items-center gap-2">
                    <span className="text-xs text-gray-400">Confidence:</span>
                    <div className="flex-1 max-w-[200px] h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          explanation.confidence >= 80
                            ? "bg-green-500"
                            : explanation.confidence >= 60
                              ? "bg-yellow-500"
                              : "bg-orange-500"
                        }`}
                        style={{ width: `${explanation.confidence}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-300">{explanation.confidence}%</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {solutions.length > 0 && (
          <div className="bg-gradient-to-br from-green-900/40 to-teal-900/40 border border-green-700/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Wrench className="w-5 h-5 text-green-400" />
              <h4 className="font-semibold text-white text-sm">Possible Solutions</h4>
            </div>

            {solutions.map((solution, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <span className="text-green-400 font-semibold text-sm mt-0.5">{idx + 1})</span>
                <p className="text-gray-200 text-sm leading-relaxed flex-1">{solution}</p>
              </div>
            ))}
          </div>
        )}

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
            <Bot className="w-12 h-12 mb-4 text-gray-600" />
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
                message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-100"
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
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
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
            className="flex-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
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
