"use client"

import { Bot, User, Paperclip } from "lucide-react"
import type { Conversation } from "@/lib/types"

interface ConversationHistoryProps {
  conversations: Conversation[]
  className?: string
}

export function ConversationHistory({ conversations, className = "" }: ConversationHistoryProps) {
  if (!conversations || conversations.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-500">No conversation history yet</p>
        <p className="text-sm text-gray-400 mt-1">Messages will appear here once the conversation begins</p>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {conversations.map((conversation, index) => (
        <div key={conversation.id} className="space-y-2">
          <div
            className={`flex items-start space-x-3 ${
              conversation.sender === "user" ? "flex-row-reverse space-x-reverse" : ""
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                conversation.sender === "user" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
              }`}
            >
              {conversation.sender === "user" ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>

            {/* Message Content */}
            <div className={`flex-1 max-w-3xl ${conversation.sender === "user" ? "text-right" : ""}`}>
              {/* Sender Label */}
              <div
                className={`text-xs font-medium text-gray-600 mb-1 ${
                  conversation.sender === "user" ? "text-right" : ""
                }`}
              >
                {conversation.sender === "user" ? "You" : "Helpdesk Support"}
              </div>

              {/* Message Bubble */}
              <div
                className={`inline-block p-4 rounded-lg max-w-full ${
                  conversation.sender === "user"
                    ? "bg-blue-500 text-white rounded-br-sm"
                    : "bg-gray-100 text-gray-900 rounded-bl-sm"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{conversation.message}</p>

                {/* Attachments */}
                {conversation.attachments && conversation.attachments.length > 0 && (
                  <div
                    className={`mt-3 pt-2 border-t ${
                      conversation.sender === "user" ? "border-blue-400" : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center space-x-2 text-xs">
                      <Paperclip className="w-3 h-3" />
                      <span className={conversation.sender === "user" ? "text-blue-100" : "text-gray-600"}>
                        Attachments: {conversation.attachments.join(", ")}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Timestamp */}
              <div className={`text-xs text-gray-500 mt-2 ${conversation.sender === "user" ? "text-right" : ""}`}>
                {new Date(conversation.timestamp).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>

          {/* Separator between conversations (except last) */}
          {index < conversations.length - 1 && (
            <div className="flex justify-center py-2">
              <div className="w-12 h-px bg-gray-200"></div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
