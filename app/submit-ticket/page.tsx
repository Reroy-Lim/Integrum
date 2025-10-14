"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/use-session"

export default function SubmitTicketPage() {
  const router = useRouter()
  const { status, session } = useSession()
  const [gmailWindow, setGmailWindow] = useState<Window | null>(null)
  const [isMonitoring, setIsMonitoring] = useState(false)

  useEffect(() => {
    console.log("[v0] Submit ticket page loaded, status:", status)

    if (status === "authenticated") {
      console.log("[v0] User authenticated, opening Gmail")

      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=heyroy23415@gmail.com`
      const newWindow = window.open(gmailUrl, "_blank")
      setGmailWindow(newWindow)
      setIsMonitoring(true)

      console.log("[v0] Gmail opened, starting Agent Chain monitoring")
    } else if (status === "unauthenticated") {
      console.log("[v0] User not authenticated, redirecting to home")
      router.push("/")
    }
  }, [status, router])

  useEffect(() => {
    if (!isMonitoring || !session?.user?.email) return

    const userEmail = session.user.email
    let pollCount = 0
    const maxPolls = 60 // Poll for 3 minutes (60 * 3 seconds = 180 seconds)

    console.log("[v0] Starting Agent Chain detection for email:", userEmail)

    const pollInterval = setInterval(async () => {
      pollCount++
      console.log(`[v0] Polling Agent Chain status (${pollCount}/${maxPolls})`)

      try {
        const response = await fetch(`/api/acknowledgement/status?email=${encodeURIComponent(userEmail)}`)
        const data = await response.json()

        if (data.acknowledged && data.verified) {
          console.log("[v0] Agent Chain execution detected - email was sent successfully!")
          clearInterval(pollInterval)
          setIsMonitoring(false)
          router.push("/?emailSent=true")
          return
        }
      } catch (error) {
        console.error("[v0] Error checking Agent Chain status:", error)
      }

      // If we've polled for 3 minutes without detecting Agent Chain, assume email wasn't sent
      if (pollCount >= maxPolls) {
        console.log("[v0] Agent Chain not detected after 3 minutes - email was not sent")
        clearInterval(pollInterval)
        setIsMonitoring(false)
        router.push("/?emailNotSent=true")
      }
    }, 3000) // Poll every 3 seconds

    return () => {
      clearInterval(pollInterval)
    }
  }, [isMonitoring, session?.user?.email, router])

  useEffect(() => {
    if (!gmailWindow) return

    const checkInterval = setInterval(() => {
      if (gmailWindow.closed) {
        console.log("[v0] Gmail window closed by user")
        clearInterval(checkInterval)
        // Don't redirect immediately - let the Agent Chain polling handle the redirect
      }
    }, 500)

    return () => clearInterval(checkInterval)
  }, [gmailWindow])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Opening Gmail...</h2>
        <p className="text-muted-foreground">Monitoring for email submission...</p>
      </div>
    </div>
  )
}
