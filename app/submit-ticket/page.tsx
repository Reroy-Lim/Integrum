"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/use-session"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export default function SubmitTicketPage() {
  const router = useRouter()
  const { status, data: session } = useSession()
  const [showConfirmation, setShowConfirmation] = useState(false)

  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=heyroy23415@gmail.com`
      const gmailWindow = window.open(gmailUrl, "_blank")

      console.log("[v0] Gmail window opened, starting monitoring")

      const userEmail = session.user.email
      let acknowledgementReceived = false
      let windowClosed = false
      const monitoringStartTime = Date.now()
      const MONITORING_TIMEOUT = 5 * 60 * 1000 // 5 minutes in milliseconds

      const pollAcknowledgement = setInterval(async () => {
        try {
          console.log("[v0] Polling acknowledgement status for:", userEmail)
          const response = await fetch(`/api/acknowledgement/status?email=${encodeURIComponent(userEmail)}`)
          const data = await response.json()

          if (data.acknowledged) {
            console.log("[v0] Acknowledgement received! Email was sent successfully")
            acknowledgementReceived = true
            clearInterval(pollAcknowledgement)
            clearInterval(checkWindowClosed)
            clearTimeout(monitoringTimeout)
            // Show success message immediately
            router.push("/?emailSent=true")
          }
        } catch (error) {
          console.error("[v0] Error polling acknowledgement:", error)
        }
      }, 3000) // Poll every 3 seconds

      const checkWindowClosed = setInterval(() => {
        if (gmailWindow && gmailWindow.closed && !windowClosed) {
          console.log("[v0] Gmail window closed, continuing to monitor for acknowledgement")
          windowClosed = true
          clearInterval(checkWindowClosed)
          // Don't stop polling - continue monitoring for acknowledgement
        }
      }, 500)

      const monitoringTimeout = setTimeout(() => {
        console.log("[v0] Monitoring timeout reached (5 minutes)")
        clearInterval(pollAcknowledgement)
        clearInterval(checkWindowClosed)

        // If acknowledgement was received, don't show confirmation
        if (acknowledgementReceived) {
          console.log("[v0] Email already confirmed via acknowledgement")
          return
        }

        // Show confirmation dialog to ask user
        console.log("[v0] No acknowledgement received after 5 minutes, asking user")
        setShowConfirmation(true)
      }, MONITORING_TIMEOUT)

      return () => {
        clearInterval(checkWindowClosed)
        clearInterval(pollAcknowledgement)
        clearTimeout(monitoringTimeout)
      }
    } else if (status === "unauthenticated") {
      router.push("/")
    }
  }, [status, session, router])

  const handleEmailSent = () => {
    console.log("[v0] User confirmed email was sent")
    setShowConfirmation(false)
    router.push("/?emailSent=true")
  }

  const handleEmailNotSent = () => {
    console.log("[v0] User confirmed email was NOT sent, returning to home")
    setShowConfirmation(false)
    router.push("/")
  }

  return (
    <>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Opening Gmail...</h2>
          <p className="text-muted-foreground">Please wait while we redirect you.</p>
        </div>
      </div>

      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Did you send the email?</DialogTitle>
            <DialogDescription>
              Please confirm whether you sent the support email to help us track your ticket properly.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2">
            <Button variant="outline" onClick={handleEmailNotSent} className="flex-1 bg-transparent">
              No, I didn't send it
            </Button>
            <Button onClick={handleEmailSent} className="flex-1 bg-blue-600 hover:bg-blue-700">
              Yes, I sent it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
