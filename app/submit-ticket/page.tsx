"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/use-session"
import { getLatestSentEmailId } from "@/lib/gmail-api"

export default function SubmitTicketPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    console.log("[v0] Submit ticket page loaded, status:", status)

    if (status === "authenticated" && session?.accessToken && !isChecking) {
      setIsChecking(true)
      handleGmailFlow(session.accessToken)
    } else if (status === "unauthenticated") {
      console.log("[v0] User not authenticated, redirecting to home")
      router.push("/")
    }
  }, [status, session, router, isChecking])

  const handleGmailFlow = async (accessToken: string) => {
    try {
      console.log("[v0] Starting Gmail flow with API detection")

      // Get the latest sent email ID before opening Gmail
      const initialSentEmailId = await getLatestSentEmailId(accessToken)
      console.log("[v0] Initial sent email ID:", initialSentEmailId)

      // Open Gmail compose window
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=heyroy23415@gmail.com`
      const gmailWindow = window.open(gmailUrl, "_blank")

      if (!gmailWindow) {
        console.error("[v0] Failed to open Gmail window")
        router.push("/?emailNotSent=true")
        return
      }

      let checkCount = 0
      const maxChecks = 120 // Check for up to 10 minutes (120 * 5 seconds)

      // Poll Gmail API to detect new sent email
      const pollInterval = setInterval(async () => {
        checkCount++
        console.log("[v0] Checking for new sent email, attempt:", checkCount)

        // Check if Gmail window is closed
        if (gmailWindow.closed) {
          clearInterval(pollInterval)
          console.log("[v0] Gmail window closed without detecting sent email")
          router.push("/?emailNotSent=true")
          return
        }

        // Check for new sent email
        try {
          const currentSentEmailId = await getLatestSentEmailId(accessToken)
          console.log("[v0] Current sent email ID:", currentSentEmailId)

          if (currentSentEmailId && currentSentEmailId !== initialSentEmailId) {
            clearInterval(pollInterval)
            console.log("[v0] New sent email detected!")
            if (gmailWindow && !gmailWindow.closed) {
              gmailWindow.close()
            }
            router.push("/?emailSent=true")
            return
          }
        } catch (error) {
          console.error("[v0] Error checking sent emails:", error)
        }

        // Stop checking after max attempts
        if (checkCount >= maxChecks) {
          clearInterval(pollInterval)
          console.log("[v0] Max check attempts reached")
          if (gmailWindow && !gmailWindow.closed) {
            gmailWindow.close()
          }
          router.push("/?emailNotSent=true")
        }
      }, 5000) // Check every 5 seconds

      // Cleanup on unmount
      return () => {
        clearInterval(pollInterval)
      }
    } catch (error) {
      console.error("[v0] Error in Gmail flow:", error)
      router.push("/?emailNotSent=true")
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Opening Gmail...</h2>
        <p className="text-muted-foreground">Please send your email. We'll detect when it's sent.</p>
      </div>
    </div>
  )
}
