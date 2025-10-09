"use client"

import { useEffect } from "react"
import { X } from "lucide-react"

interface EmailNotSentToastProps {
  isOpen: boolean
  onClose: () => void
}

export function EmailNotSentToast({ isOpen, onClose }: EmailNotSentToastProps) {
  useEffect(() => {
    if (isOpen) {
      // Auto-close after 10 seconds
      const timer = setTimeout(() => {
        onClose()
      }, 10000)

      return () => clearTimeout(timer)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-right">
      <div className="bg-red-900 text-white rounded-lg shadow-lg p-6 max-w-md border border-red-700">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-red-100">Email Not Sent</h3>
          <button onClick={onClose} className="text-red-200 hover:text-white transition-colors" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-red-100 text-sm">
          We have detected that you did not send the email. To have better assistance, please resend the email. Thank
          you!
        </p>
      </div>
    </div>
  )
}
