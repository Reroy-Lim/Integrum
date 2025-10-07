"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Mail, ExternalLink, Clock, CheckCircle, Copy, Users, Plus } from "lucide-react"
import { GmailRedirectHandler } from "@/lib/gmail-redirect"

interface GmailFlowDialogProps {
  isOpen: boolean
  onClose: () => void
  ticketId: string
  customerEmail: string
  gmailComposeUrl: string
}

export function GmailFlowDialog({ isOpen, onClose, ticketId, customerEmail, gmailComposeUrl }: GmailFlowDialogProps) {
  const [step, setStep] = useState<"compose" | "waiting" | "return">("compose")
  const [returnUrl, setReturnUrl] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const instructions = GmailRedirectHandler.createGmailInstructions(ticketId, customerEmail)
      setReturnUrl(instructions.returnUrl)
    }
  }, [isOpen, ticketId, customerEmail])

  const extractEmailDetails = () => {
    const urlParams = new URLSearchParams(gmailComposeUrl.split("?")[1])
    return {
      to: urlParams.get("to") || "",
      subject: urlParams.get("su") || "",
      body: urlParams.get("body") || "",
    }
  }

  const generateGmailUrls = () => {
    const { to, subject, body } = extractEmailDetails()
    return {
      direct: GmailRedirectHandler.generateGmailComposeUrl(to, subject, body, customerEmail),
      switchAccount: GmailRedirectHandler.generateAccountSwitchUrl(to, subject, body, customerEmail),
      addAccount: GmailRedirectHandler.generateAddAccountUrl(to, subject, body, customerEmail),
    }
  }

  const handleOpenGmail = (urlType: "direct" | "switchAccount" | "addAccount" = "direct") => {
    const urls = generateGmailUrls()
    const selectedUrl = urls[urlType]

    console.log(`[v0] Opening Gmail with ${urlType} method for:`, customerEmail)
    window.open(selectedUrl, "_blank")
    setStep("waiting")
  }

  const handleCopyReturnUrl = async () => {
    try {
      await navigator.clipboard.writeText(returnUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy URL:", err)
    }
  }

  const handleReturnFromGmail = async () => {
    try {
      const response = await fetch("/api/verify-acknowledgement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticketId,
          customerEmail,
          submissionTimestamp: Date.now(),
        }),
      })

      const result = await response.json()

      if (result.verified) {
        window.location.href = result.redirectUrl || `/?view=yourTickets&ticket=${ticketId}&timestamp=${Date.now()}`
      } else {
        alert(result.error || "Verification failed")
      }
    } catch (error) {
      console.error("[v0] Error verifying acknowledgement:", error)
      alert("Error verifying acknowledgement. Please try again.")
    }
  }

  const renderContent = () => {
    switch (step) {
      case "compose":
        return (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Mail className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Ready to Send Email</span>
              </div>
              <p className="text-sm text-blue-700">
                Choose how you'd like to open Gmail with your ticket details pre-filled.
              </p>
            </div>

            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Sending from:</p>
              <p className="text-sm font-medium text-gray-800">{customerEmail}</p>
              <p className="text-xs text-gray-600 mt-2 mb-1">Ticket ID:</p>
              <p className="text-sm font-medium text-gray-800">{ticketId}</p>
            </div>

            <div className="space-y-2">
              <Button
                onClick={() => handleOpenGmail("direct")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Gmail (Current Account)
              </Button>

              <Button
                onClick={() => handleOpenGmail("switchAccount")}
                variant="outline"
                className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <Users className="w-4 h-4 mr-2" />
                Switch Gmail Account
              </Button>

              <Button
                onClick={() => handleOpenGmail("addAccount")}
                variant="outline"
                className="w-full border-green-200 text-green-700 hover:bg-green-50"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Gmail Account
              </Button>

              <div className="text-center pt-1">
                <a
                  href="/?view=faq"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600 text-sm underline"
                >
                  Recommending: Check out our FAQ
                </a>
              </div>
            </div>

            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-700">
                <strong>Having trouble signing in?</strong> Try "Switch Gmail Account" or "Add New Gmail Account"
                options above.
              </p>
            </div>
          </div>
        )

      case "waiting":
        return (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">Waiting for Auto-Acknowledgement</span>
              </div>
              <p className="text-sm text-yellow-700 mb-3">
                After sending your email, wait for the auto-acknowledgement from <strong>heyroy23415@gmail.com</strong>
              </p>
              <p className="text-xs text-yellow-600">
                This usually takes 1-5 minutes. Once you see it, click the return button below.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-white border border-gray-200 rounded-lg">
                <p className="text-xs text-gray-600 mb-2">Return URL (copy this if needed):</p>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={returnUrl}
                    readOnly
                    className="flex-1 text-xs p-2 bg-gray-50 border border-gray-200 rounded"
                  />
                  <Button variant="outline" size="sm" onClick={handleCopyReturnUrl} className="px-3 bg-transparent">
                    {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              </div>

              <Button onClick={handleReturnFromGmail} className="w-full bg-green-600 hover:bg-green-700 text-white">
                <CheckCircle className="w-4 h-4 mr-2" />I Received the Auto-Acknowledgement - Return to Ticket
              </Button>
            </div>

            <div className="text-center">
              <Button variant="outline" onClick={onClose} className="text-sm bg-transparent">
                Cancel
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full bg-white">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <DialogTitle className="text-xl font-semibold text-center text-gray-800">
            {step === "compose" ? "Send Your Email" : "Waiting for Acknowledgement"}
          </DialogTitle>
        </DialogHeader>

        {renderContent()}
      </DialogContent>
    </Dialog>
  )
}
