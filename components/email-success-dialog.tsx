"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Mail } from "@/components/icons"

interface EmailSuccessDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function EmailSuccessDialog({ isOpen, onClose }: EmailSuccessDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full bg-white">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <Mail className="w-10 h-10 text-green-600" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-semibold text-center text-gray-800">
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
