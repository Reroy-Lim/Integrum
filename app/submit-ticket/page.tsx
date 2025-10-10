"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/use-session"

export default function SubmitTicketPage() {
  const router = useRouter()
  const { status, data: session } = useSession()

  useEffect(() => {
    console.log("[v0] Submit ticket page loaded, status:", status)

    if (status === "authenticated") {
      console.log("[v0] User authenticated, opening Gmail and monitoring for acknowledgement")

      const userEmail = session?.user?.email
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=heyroy23415@gmail.com`

      const gmailWindow = window.open(gmailUrl, "_blank")

      // Monitor Gmail window closure
      const checkInterval = setInterval(() => {
        if (gmailWindow && gmailWindow.closed) {
          clearInterval(checkInterval)
          console.log("[v0] Gmail window closed, starting acknowledgement polling")

          // Start polling for acknowledgement
          let pollCount = 0
          const maxPolls = 60 // Poll for up to 5 minutes (60 * 5 seconds)

          const pollAcknowledgement = setInterval(async () => {
            pollCount++
            console.log(`[v0] Polling acknowledgement (attempt ${pollCount}/${maxPolls})`)

            try {
              const response = await fetch(`/api/acknowledgement/status?email=${encodeURIComponent(userEmail)}`)
              const data = await response.json()

              if (data.success && data.acknowledged && data.verified) {
                clearInterval(pollAcknowledgement)
                console.log("[v0] Acknowledgement verified, email was sent successfully")
                router.push("/?emailSent=true")
              } else if (pollCount >= maxPolls) {
                clearInterval(pollAcknowledgement)
                console.log("[v0] Polling timeout reached, email likely not sent")
                router.push("/?emailNotSent=true")
              }
            } catch (error) {
              console.error("[v0] Error polling acknowledgement:", error)
              if (pollCount >= maxPolls) {
                clearInterval(pollAcknowledgement)
                router.push("/?emailNotSent=true")
              }
            }
          }, 5000) // Poll every 5 seconds
        }
      }, 500)

      return () => {
        clearInterval(checkInterval)
      }
    } else if (status === "unauthenticated") {
      console.log("[v0] User not authenticated, redirecting to home")
      router.push("/")
    }
  }, [status, session, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Opening Gmail...</h2>
        <p className="text-muted-foreground">Please wait while we redirect you.</p>
      </div>
    </div>
  )
}
