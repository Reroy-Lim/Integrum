"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Mail } from "@/components/icons"
import { Button } from "@/components/ui/button"

interface EmailSuccessDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function EmailSuccessDialog({ isOpen, onClose }: EmailSuccessDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full bg-white">
        <div className="flex flex-col items-center text-center space-y-4 py-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <Mail className="w-10 h-10 text-green-600" />
          </div>

          <h2 className="text-2xl font-semibold text-gray-900">Email Sent Successfully</h2>

          <div className="space-y-3 text-gray-600">
            <p>
              Thank you for sending your Integrum email. You will receive a separate automatic acknowledgment email.
            </p>
            <p>
              The arrival of this email confirms that we have successfully received your request, and a proposal will be
              linked to your ticket.
            </p>
          </div>

          <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white px-8">
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
