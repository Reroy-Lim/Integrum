"use client"

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

interface LogoutConfirmationDialogProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function LogoutConfirmationDialog({ isOpen, onConfirm, onCancel }: LogoutConfirmationDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className="max-w-md bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-semibold text-gray-800">Confirm Logout</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600">Are you sure you want to log out?</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-3">
          <Button onClick={onCancel} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
            NO
          </Button>
          <Button onClick={onConfirm} className="flex-1 bg-blue-600 hover:bg-blue-700 text-black">
            CONFIRM
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
