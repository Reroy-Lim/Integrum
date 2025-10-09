"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Mail, AlertCircle } from "@/components/icons"

interface EmailStatusDialogProps {
  isOpen: boolean
  onClose: () => void
  status: "success" | "failure"
}

export function EmailStatusDialog({ isOpen, onClose, status }: EmailStatusDialogProps) {
  if (status === "success") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md w-full bg-white">
          <DialogHeader className="space-y-4">
            <div className="flex items-center justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <DialogTitle className="text-xl font-semibold text-center text-gray-800">
              Email Sent Successfully
            </DialogTitle>
          </DialogHeader>

          <DialogDescription className="text-center space-y-4">
            <p className="text-gray-600">
              Thank you for sending your Integrum email. You will receive a separate automatic acknowledgment email.
            </p>
            <p className="text-gray-600">
              The arrival of this email confirms that we have successfully received your request, and a proposal will be
              linked to your ticket.
            </p>
          </DialogDescription>

          <div className="flex justify-center mt-4">
            <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white px-8">
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full bg-gradient-to-br from-red-900 to-red-800 border-red-700">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 bg-red-800 rounded-full flex items-center justify-center border-2 border-red-600">
              <AlertCircle className="w-8 h-8 text-red-200" />
            </div>
          </div>
          <DialogTitle className="text-xl font-semibold text-center text-red-100">Email Not Sent</DialogTitle>
        </DialogHeader>

        <DialogDescription className="text-center space-y-4">
          <p className="text-red-100">
            We have detected that you did not send the email. To have better assistance, please resend the email. Thank
            you!
          </p>
        </DialogDescription>

        <div className="flex justify-center mt-4">
          <Button onClick={onClose} className="bg-red-600 hover:bg-red-700 text-white px-8">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
