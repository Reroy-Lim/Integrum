"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/use-session"

export default function SubmitTicketPage() {
  const router = useRouter()
  const { status } = useSession()
  const monitoringRef = useRef(false)

  useEffect(() => {
    console.log("[v0] Submit ticket page loaded, status:", status)

    if (status === "authenticated" && !monitoringRef.current) {
      monitoringRef.current = true
      console.log("[v0] User authenticated, opening Gmail")

      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=heyroy23415@gmail.com`
      const gmailWindow = window.open(gmailUrl, "_blank")

      if (gmailWindow) {
        console.log("[v0] Gmail window opened, starting monitor")
        const openTime = Date.now()

        const checkInterval = setInterval(() => {
          if (gmailWindow.closed) {
            clearInterval(checkInterval)
            const timeOpen = Date.now() - openTime

            // If window was open for less than 30 seconds, assume email not sent
            if (timeOpen < 30000) {
              console.log("[v0] Gmail window closed quickly, showing email not sent message")
              router.push("/?emailNotSent=true")
            } else {
              // If window was open for 30+ seconds, assume email was sent
              console.log("[v0] Gmail window was open long enough, assuming email sent")
              router.push("/?emailSent=true")
            }
          }
        }, 500)

        // After 2 minutes, assume email was sent and redirect with success
        const successTimeout = setTimeout(() => {
          clearInterval(checkInterval)
          if (!gmailWindow.closed) {
            console.log("[v0] Gmail window still open after 2 minutes, assuming email sent")
            router.push("/?emailSent=true")
          }
        }, 120000) // 2 minutes

        return () => {
          clearInterval(checkInterval)
          clearTimeout(successTimeout)
        }
      } else {
        console.log("[v0] Failed to open Gmail window")
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
