"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Send, Paperclip, X, Upload } from "lucide-react"

interface ReplyInterfaceProps {
  ticketId: string
  onReplySubmitted?: (reply: any) => void
  disabled?: boolean
  className?: string
}

export function ReplyInterface({ ticketId, onReplySubmitted, disabled = false, className = "" }: ReplyInterfaceProps) {
  const [message, setMessage] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const validFiles = files.filter((file) => {
      // Limit file size to 10MB
      if (file.size > 10 * 1024 * 1024) {
        setError(`File ${file.name} is too large. Maximum size is 10MB.`)
        return false
      }
      return true
    })

    setAttachments((prev) => [...prev, ...validFiles])
    setError(null)
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!message.trim() && attachments.length === 0) {
      setError("Please enter a message or attach a file")
      return
    }

    try {
      setSending(true)
      setError(null)

      // In a real implementation, you would upload attachments first
      const attachmentNames = attachments.map((file) => file.name)

      const response = await fetch(`/api/tickets/${ticketId}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message.trim(),
          attachments: attachmentNames,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Clear form
        setMessage("")
        setAttachments([])

        // Notify parent component
        if (onReplySubmitted && data.conversation) {
          onReplySubmitted(data.conversation)
        }
      } else {
        setError(data.error || "Failed to send reply")
      }
    } catch (err) {
      setError("Network error occurred")
      console.error("Error sending reply:", err)
    } finally {
      setSending(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <Card className={`bg-white border-gray-200 ${className}`}>
      <CardHeader>
        <CardTitle className="text-gray-900 flex items-center space-x-2">
          <Send className="w-5 h-5" />
          <span>Send Reply</span>
        </CardTitle>
        <CardDescription className="text-gray-600">Continue the conversation with our helpdesk team</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Message Input */}
        <div className="space-y-2">
          <Textarea
            placeholder="Type your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[120px] resize-none placeholder:text-black text-black"
            disabled={disabled || sending}
          />
          <div className="text-xs text-gray-500 text-right">{message.length}/2000 characters</div>
        </div>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Attachments</h4>
            <div className="space-y-2">
              {attachments.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Paperclip className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAttachment(index)}
                    disabled={sending}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              accept=".txt,.log,.png,.jpg,.jpeg,.pdf,.doc,.docx"
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || sending}
              className="bg-white text-black border-gray-300 hover:bg-gray-50"
            >
              <Paperclip className="w-4 h-4 mr-2" />
              Attach Files
            </Button>
            <span className="text-xs text-gray-500">Max 10MB per file</span>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={disabled || sending || (!message.trim() && attachments.length === 0)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {sending ? (
              <>
                <Upload className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Reply
              </>
            )}
          </Button>
        </div>

        {/* Help Text */}
        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
          <p className="font-medium mb-1">Tips for better support:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Include error messages or screenshots if applicable</li>
            <li>Describe steps you've already tried</li>
            <li>Mention your operating system and browser version</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
