"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle, Mail, Ticket, Loader2, AlertTriangle, Clock } from "lucide-react"

interface JiraTicket {
  id: string
  key: string
  summary: string
  status: {
    name: string
    statusCategory: {
      name: string
    }
  }
  created: string
  updated: string
  assignee?: {
    displayName: string
    emailAddress: string
  }
  reporter: {
    displayName: string
    emailAddress: string
  }
  description?: string
  priority: {
    name: string
  }
  issuetype: {
    name: string
  }
}

interface AutoAcknowledgementDialogProps {
  isOpen: boolean
  onClose: () => void
  customerEmail?: string
}

export function AutoAcknowledgementDialog({ isOpen, onClose, customerEmail }: AutoAcknowledgementDialogProps) {
  const [countdown, setCountdown] = useState(10)
  const [latestTicket, setLatestTicket] = useState<JiraTicket | null>(null)
  const [isLoadingTicket, setIsLoadingTicket] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "verified" | "failed">("pending")
  const [acknowledgementData, setAcknowledgementData] = useState<any>(null)

  useEffect(() => {
    if (isOpen && countdown > 0 && verificationStatus === "verified") {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0 && verificationStatus === "verified") {
      // Auto-redirect to ticket page after countdown
      handleGoToTickets()
    }
  }, [isOpen, countdown, onClose, verificationStatus])

  useEffect(() => {
    if (isOpen && customerEmail) {
      fetchAcknowledgementStatus(customerEmail)
    }
  }, [isOpen, customerEmail])

  const fetchAcknowledgementStatus = async (email: string) => {
    setIsLoadingTicket(true)
    try {
      const response = await fetch(`/api/acknowledgement/status?email=${encodeURIComponent(email)}`)
      const data = await response.json()

      if (data.success && data.acknowledged && data.verified) {
        setVerificationStatus("verified")
        setAcknowledgementData(data.data)
        if (data.latestTicket) {
          setLatestTicket(data.latestTicket)
        }
      } else if (data.success && data.acknowledged && !data.verified) {
        setVerificationStatus("failed")
      } else {
        // Still pending acknowledgement
        setVerificationStatus("pending")
      }
    } catch (error) {
      console.error("Error fetching acknowledgement status:", error)
      setVerificationStatus("failed")
    } finally {
      setIsLoadingTicket(false)
    }
  }

  const handleGoToTickets = () => {
    if (latestTicket) {
      // Redirect to specific ticket page
      window.location.href = `/ticket/${latestTicket.key}`
    } else {
      // Redirect to tickets overview page
      window.location.href = "/?view=yourTickets"
    }
    // Close dialog after redirect is initiated
    onClose()
  }

  const handleRetryVerification = () => {
    if (customerEmail) {
      setVerificationStatus("pending")
      fetchAcknowledgementStatus(customerEmail)
    }
  }

  const renderContent = () => {
    if (verificationStatus === "pending" || isLoadingTicket) {
      return (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Verifying Acknowledgement</span>
            </div>
            <p className="text-sm text-blue-700">
              Please wait while we verify your ticket acknowledgement and ensure it matches the correct submission
              time...
            </p>
          </div>
        </div>
      )
    }

    if (verificationStatus === "failed") {
      return (
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">Verification Failed</span>
            </div>
            <p className="text-sm text-red-700 mb-3">
              We couldn't verify that this acknowledgement matches your recent ticket submission. This may happen if:
            </p>
            <ul className="text-xs text-red-600 ml-4 list-disc space-y-1">
              <li>The acknowledgement email was sent for an older ticket</li>
              <li>There was a timing mismatch between submission and acknowledgement</li>
              <li>No recent ticket was found for your email address</li>
            </ul>
          </div>

          <div className="flex space-x-3">
            <Button variant="outline" onClick={handleRetryVerification} className="flex-1 bg-transparent">
              Retry Verification
            </Button>
            <Button
              onClick={() => (window.location.href = "/?view=yourTickets")}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Go to Tickets Page
            </Button>
          </div>
        </div>
      )
    }

    // Verified status - show success content
    return (
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Mail className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Auto-Acknowledgement Verified</span>
          </div>
          <div className="text-sm text-blue-700 space-y-2">
            <p>
              <strong>Hello,</strong>
            </p>
            <p>Thank you for contacting Integrum Global.</p>
            <p>
              We are available on working days, Monday to Friday, from 9am to 6pm (excluding Saturdays, Sundays, and
              public holidays).
            </p>
            <p>We appreciate your patience during this time.</p>
            <p>
              We have received your ticket, and it is currently pending resolution. Our team will work on it as soon as
              possible.
            </p>
          </div>
        </div>

        {customerEmail && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-xs text-gray-600">Confirmation sent to:</p>
            <p className="text-sm font-medium text-gray-800">{customerEmail}</p>
            {acknowledgementData?.emailTimestamp && (
              <div className="flex items-center space-x-1 mt-1">
                <Clock className="w-3 h-3 text-gray-500" />
                <p className="text-xs text-gray-500">
                  Verified at: {new Date(acknowledgementData.emailTimestamp).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        )}

        {latestTicket && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Ticket className="w-4 h-4 text-green-600" />
              <p className="text-xs text-green-600 font-medium">Latest Ticket Created:</p>
            </div>
            <p className="text-sm font-medium text-green-800 mb-1">
              {latestTicket.key}: {latestTicket.summary}
            </p>
            <div className="flex items-center justify-between">
              <p className="text-xs text-green-600">Status: {latestTicket.status.name}</p>
              <p className="text-xs text-green-600">Priority: {latestTicket.priority.name}</p>
            </div>
          </div>
        )}

        <div className="text-center">
          <p className="text-sm text-gray-600 mb-4">
            {latestTicket ? (
              <>
                Redirecting to your ticket <strong>{latestTicket.key}</strong> in{" "}
                <span className="font-bold text-blue-600">{countdown}</span> seconds...
              </>
            ) : (
              <>
                Redirecting to your ticket page in <span className="font-bold text-blue-600">{countdown}</span>{" "}
                seconds...
              </>
            )}
          </p>
          <Button onClick={handleGoToTickets} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            {latestTicket ? `Go to Ticket ${latestTicket.key} Now` : "Go to Ticket Page Now"}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full bg-white">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-center">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center ${
                verificationStatus === "verified"
                  ? "bg-green-100"
                  : verificationStatus === "failed"
                    ? "bg-red-100"
                    : "bg-blue-100"
              }`}
            >
              {verificationStatus === "verified" ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : verificationStatus === "failed" ? (
                <AlertTriangle className="w-8 h-8 text-red-600" />
              ) : (
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              )}
            </div>
          </div>
          <DialogTitle className="text-xl font-semibold text-center text-gray-800">
            {verificationStatus === "verified"
              ? "Ticket Submitted Successfully!"
              : verificationStatus === "failed"
                ? "Verification Required"
                : "Verifying Submission..."}
          </DialogTitle>
        </DialogHeader>

        {renderContent()}
      </DialogContent>
    </Dialog>
  )
}
