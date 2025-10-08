"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/use-session"

export default function SubmitTicketPage() {
  const router = useRouter()
  const { status } = useSession()

  useEffect(() => {
    console.log("[v0] Submit ticket page loaded, status:", status)

    if (status === "authenticated") {
      console.log("[v0] User authenticated, opening Gmail")

      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=heyroy23415@gmail.com`
      const gmailWindow = window.open(gmailUrl, "_blank")
      const openTime = Date.now()

      if (gmailWindow) {
        console.log("[v0] Gmail window opened, starting monitoring")

        // Monitor if the Gmail window is closed
        const checkInterval = setInterval(() => {
          if (gmailWindow.closed) {
            clearInterval(checkInterval)
            const timeOpen = Date.now() - openTime

            console.log("[v0] Gmail window closed after", timeOpen, "ms")

            // If closed within 30 seconds, assume they didn't send the email
            if (timeOpen < 30000) {
              console.log("[v0] Window closed too quickly, assuming email not sent")
              router.push("/?emailNotSent=true")
            } else {
              console.log("[v0] Window was open long enough, assuming email sent")
              router.push("/?ticketSent=true")
            }
          }
        }, 500) // Check every 500ms

        // Cleanup: Stop monitoring after 5 minutes and assume email was sent
        setTimeout(() => {
          clearInterval(checkInterval)
          console.log("[v0] Monitoring timeout reached, assuming email sent")
          if (!gmailWindow.closed) {
            router.push("/?ticketSent=true")
          }
        }, 300000) // 5 minutes
      } else {
        // If popup was blocked, show error
        console.log("[v0] Failed to open Gmail window (popup blocked?)")
        router.push("/?emailNotSent=true")
      }
    } else if (status === "unauthenticated") {
      console.log("[v0] User not authenticated, redirecting to home")
      router.push("/")
    }
  }, [status, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Opening Gmail...</h2>
        <p className="text-muted-foreground">Please wait while we redirect you.</p>
      </div>
    </div>
  )
}
