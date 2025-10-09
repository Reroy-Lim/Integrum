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
      console.log("[v0] User authenticated, opening Gmail with monitoring")

      // Open Gmail with pre-filled recipient
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=heyroy23415@gmail.com`
      const gmailWindow = window.open(gmailUrl, "_blank")

      if (!gmailWindow) {
        console.error("[v0] Failed to open Gmail window")
        router.push("/?emailError=true")
        return
      }

      const openTime = Date.now()
      let emailSent = false

      const checkInterval = setInterval(() => {
        if (gmailWindow.closed) {
          clearInterval(checkInterval)
          const timeOpen = (Date.now() - openTime) / 1000 // Convert to seconds

          console.log("[v0] Gmail window closed after", timeOpen, "seconds")

          if (timeOpen > 30) {
            console.log("[v0] Window open > 30s, assuming email sent successfully")
            emailSent = true
            router.push("/?emailSent=true")
          } else {
            console.log("[v0] Window closed quickly, assuming email not sent")
            router.push("/?emailNotSent=true")
          }
        }
      }, 500) // Check every 500ms

      setTimeout(() => {
        if (!gmailWindow.closed) {
          console.log("[v0] Monitoring timeout reached, assuming email sent")
          clearInterval(checkInterval)
          if (!emailSent) {
            router.push("/?emailSent=true")
          }
        }
      }, 600000) // 10 minutes
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
