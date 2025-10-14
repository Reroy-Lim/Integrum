"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/use-session"

export default function SubmitTicketPage() {
  const router = useRouter()
  const { status, session } = useSession()
  const [gmailWindow, setGmailWindow] = useState<Window | null>(null)
  const [isPolling, setIsPolling] = useState(false)

  useEffect(() => {
    console.log("[v0] Submit ticket page loaded, status:", status)

    if (status === "authenticated") {
      console.log("[v0] User authenticated, opening Gmail")

      // Open Gmail with pre-filled recipient
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=heyroy23415@gmail.com`
      const newWindow = window.open(gmailUrl, "_blank")
      setGmailWindow(newWindow)
      setIsPolling(true)

      console.log("[v0] Gmail opened, starting acknowledgement polling")
    } else if (status === "unauthenticated") {
      console.log("[v0] User not authenticated, redirecting to home")
      router.push("/")
    }
  }, [status, router])

  useEffect(() => {
    if (!isPolling || !session?.user?.email) return

    let pollCount = 0
    const maxPolls = 240 // Poll for 2 minutes (240 * 500ms = 120 seconds)

    const pollInterval = setInterval(async () => {
      pollCount++

      try {
        console.log(`[v0] Polling acknowledgement status (attempt ${pollCount}/${maxPolls})`)
        const response = await fetch(`/api/acknowledgement/status?email=${encodeURIComponent(session.user.email)}`)
        const data = await response.json()

        if (data.success && data.acknowledged && data.verified) {
          console.log("[v0] Acknowledgement received! Email was sent successfully")
          clearInterval(pollInterval)
          setIsPolling(false)
          // Redirect with success parameter
          router.push("/?emailSent=true")
          return
        }
      } catch (error) {
        console.error("[v0] Error polling acknowledgement status:", error)
      }

      // Stop polling after max attempts
      if (pollCount >= maxPolls) {
        console.log("[v0] Max polling attempts reached, stopping")
        clearInterval(pollInterval)
        setIsPolling(false)
      }
    }, 500) // Poll every 500ms

    return () => {
      clearInterval(pollInterval)
    }
  }, [isPolling, session?.user?.email, router])

  useEffect(() => {
    if (!gmailWindow || !isPolling) return

    const checkInterval = setInterval(() => {
      if (gmailWindow.closed) {
        console.log("[v0] Gmail window closed")
        clearInterval(checkInterval)

        // Wait a moment to see if acknowledgement comes through
        setTimeout(() => {
          if (isPolling) {
            console.log("[v0] Gmail closed without acknowledgement, showing error")
            setIsPolling(false)
            router.push("/?emailNotSent=true")
          }
        }, 2000) // Wait 2 seconds for any pending acknowledgement
      }
    }, 500)

    return () => clearInterval(checkInterval)
  }, [gmailWindow, isPolling, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Opening Gmail...</h2>
        <p className="text-muted-foreground">Please wait while we redirect you.</p>
      </div>
    </div>
  )
}
