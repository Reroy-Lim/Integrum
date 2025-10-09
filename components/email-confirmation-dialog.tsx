"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Mail } from "lucide-react"

interface EmailConfirmationDialogProps {
  open: boolean
  onConfirm: (sent: boolean) => void
}

export function EmailConfirmationDialog({ open, onConfirm }: EmailConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <DialogTitle className="text-center text-xl">Email Confirmation</DialogTitle>
          <DialogDescription className="text-center">Did you send the email to Integrum support?</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row gap-2 sm:justify-center">
          <Button
            variant="outline"
            onClick={() => onConfirm(false)}
            className="flex-1 border-red-600 text-red-600 hover:bg-red-50"
          >
            No, I didn't send it
          </Button>
          <Button onClick={() => onConfirm(true)} className="flex-1 bg-green-600 hover:bg-green-700">
            Yes, I sent it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
