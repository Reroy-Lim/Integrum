"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/use-session"

export default function SubmitTicketPage() {
  const router = useRouter()
  const { status } = useSession()
  const [monitoringStarted, setMonitoringStarted] = useState(false)

  useEffect(() => {
    console.log("[v0] Submit ticket page loaded, status:", status)

    if (status === "authenticated" && !monitoringStarted) {
      console.log("[v0] User authenticated, opening Gmail with monitoring")
      setMonitoringStarted(true)

      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=heyroy23415@gmail.com`
      const gmailWindow = window.open(gmailUrl, "_blank")

      if (!gmailWindow) {
        console.error("[v0] Failed to open Gmail window")
        router.push("/?emailStatus=failure")
        return
      }

      const openTime = Date.now()
      let hasRedirected = false

      // Monitor the Gmail window
      const checkInterval = setInterval(() => {
        if (gmailWindow.closed && !hasRedirected) {
          clearInterval(checkInterval)
          hasRedirected = true

          const timeOpen = Date.now() - openTime

          // If window was open for more than 30 seconds, assume email was sent
          if (timeOpen >= 30000) {
            console.log("[v0] Gmail window closed after 30+ seconds, assuming email sent")
            router.push("/?emailStatus=success")
          } else {
            console.log("[v0] Gmail window closed quickly, assuming email not sent")
            router.push("/?emailStatus=failure")
          }
        }
      }, 500)

      // Cleanup after 10 minutes - assume success if still monitoring
      setTimeout(() => {
        if (!hasRedirected) {
          clearInterval(checkInterval)
          hasRedirected = true
          console.log("[v0] Monitoring timeout reached, assuming email sent")
          router.push("/?emailStatus=success")
        }
      }, 600000)
    } else if (status === "unauthenticated") {
      console.log("[v0] User not authenticated, redirecting to home")
      router.push("/")
    }
  }, [status, router, monitoringStarted])

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2 text-white">Opening Gmail...</h2>
        <p className="text-gray-400">Please compose and send your email. This window will update automatically.</p>
      </div>
    </div>
  )
}
