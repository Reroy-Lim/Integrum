"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface GoogleSignInModalProps {
  isOpen: boolean
  onClose: () => void
  onContinue: () => void
  type: "submit" | "review"
  onNavigateToFAQ?: () => void
}

export function GoogleSignInModal({ isOpen, onClose, onContinue, type, onNavigateToFAQ }: GoogleSignInModalProps) {
  const [showFAQContent, setShowFAQContent] = useState(false)

  const getModalContent = () => {
    if (type === "submit") {
      return {
        title: "Sign in with Google",
        subtitle: "Choose an account",
        description: "to continue on Integrum",
        message: "Recommending: Check out our FAQ",
        messageLink: true,
      }
    } else {
      return {
        title: "Sign in with Google",
        subtitle: "Choose an account",
        description: "to continue on Integrum",
        message: "Return back to the app, after emails has been sent",
        messageLink: false,
      }
    }
  }

  const content = getModalContent()

  const handleFAQClick = () => {
    if (onNavigateToFAQ) {
      onClose() // Close the modal first
      onNavigateToFAQ() // Navigate to FAQ with specific section expanded
    } else {
      setShowFAQContent(true) // Fallback to inline content
    }
  }

  const handleBackToModal = () => {
    setShowFAQContent(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full bg-white border-0 p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-black">G</span>
            </div>
            <span className="text-lg font-medium text-gray-800">{content.title}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="w-8 h-8 p-0 rounded-full bg-gray-100 hover:bg-gray-200"
          >
            <X className="w-4 h-4 text-gray-600" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!showFAQContent ? (
            <>
              <div>
                <h2 className="text-2xl font-normal text-gray-800 mb-1">{content.subtitle}</h2>
                <p className="text-sm text-gray-600">
                  {content.description} <span className="text-blue-600">Integrum</span>
                </p>
              </div>

              <div className="text-center">
                {content.messageLink ? (
                  <button
                    onClick={handleFAQClick}
                    className="text-blue-600 hover:underline text-sm underline cursor-pointer"
                  >
                    {content.message}
                  </button>
                ) : (
                  <p className="text-blue-600 text-sm">{content.message}</p>
                )}
              </div>

              <div className="flex justify-center">
                <Button
                  onClick={onContinue}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-md font-medium"
                >
                  Continue with Google
                </Button>
              </div>
            </>
          ) : (
            <>
              <div>
                <h2 className="text-2xl font-normal text-gray-800 mb-1">FAQ</h2>
                <p className="text-sm text-gray-600">Frequently Asked Questions</p>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-800 mb-2">What to fill in email address "To" Under Compose?</h3>
                  <div className="text-gray-600 space-y-2">
                    <p>Open Gmail Compose manually and fill in:</p>
                    <div className="bg-blue-50 border border-blue-200 rounded p-2">
                      <p>
                        <strong>To:</strong> heyroy23415@gmail.com
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button onClick={handleBackToModal} variant="outline" className="px-6 py-2 bg-transparent">
                  Back
                </Button>
                <Button
                  onClick={onContinue}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-md font-medium"
                >
                  Continue with Google
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
