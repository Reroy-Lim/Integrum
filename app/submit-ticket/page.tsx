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

      if (gmailWindow) {
        console.log("[v0] Gmail window opened, starting monitoring")
        const openTime = Date.now()

        const checkInterval = setInterval(() => {
          if (gmailWindow.closed) {
            clearInterval(checkInterval)
            const timeOpen = Date.now() - openTime
            const secondsOpen = Math.floor(timeOpen / 1000)

            console.log("[v0] Gmail window closed after", secondsOpen, "seconds")

            if (secondsOpen < 10) {
              // Closed very quickly - likely didn't send
              console.log("[v0] Window closed quickly, assuming email not sent")
              router.push("/?emailNotSent=true")
            } else {
              // Window was open long enough - likely sent email
              console.log("[v0] Window was open for a while, assuming email sent")
              router.push("/?emailSent=true")
            }
          }
        }, 500) // Check every 500ms
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
