"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/use-session"

export default function SubmitTicketPage() {
  const router = useRouter()
  const { status } = useSession()
  const [isMonitoring, setIsMonitoring] = useState(false)
  const gmailWindowRef = useRef<Window | null>(null)
  const monitorIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const openTimeRef = useRef<number>(0)

  useEffect(() => {
    console.log("[v0] Submit ticket page loaded, status:", status)

    if (status === "authenticated" && !isMonitoring) {
      console.log("[v0] User authenticated, opening Gmail and starting monitor")
      setIsMonitoring(true)

      // Open Gmail with pre-filled recipient
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=heyroy23415@gmail.com`
      const gmailWindow = window.open(gmailUrl, "_blank")
      gmailWindowRef.current = gmailWindow
      openTimeRef.current = Date.now()

      // Start monitoring the Gmail window
      monitorIntervalRef.current = setInterval(() => {
        if (gmailWindowRef.current && gmailWindowRef.current.closed) {
          console.log("[v0] Gmail window closed, checking time open")
          clearInterval(monitorIntervalRef.current!)

          const timeOpen = Date.now() - openTimeRef.current
          const timeOpenSeconds = Math.floor(timeOpen / 1000)

          console.log("[v0] Gmail window was open for", timeOpenSeconds, "seconds")

          // Condition logic:
          // If window open < 15 seconds → assume not sent (too quick)
          // If window open >= 15 seconds → assume sent (had time to compose and send)
          if (timeOpenSeconds < 15) {
            console.log("[v0] Window closed too quickly, assuming email not sent")
            router.push("/?emailStatus=failure")
          } else {
            console.log("[v0] Window open long enough, assuming email sent")
            router.push("/?emailStatus=success")
          }
        }
      }, 500) // Check every 500ms

      // Cleanup function
      return () => {
        if (monitorIntervalRef.current) {
          clearInterval(monitorIntervalRef.current)
        }
      }
    } else if (status === "unauthenticated") {
      console.log("[v0] User not authenticated, redirecting to home")
      router.push("/")
    }
  }, [status, router, isMonitoring])

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2 text-white">Opening Gmail...</h2>
        <p className="text-gray-400">Please compose and send your email. We're monitoring your progress.</p>
      </div>
    </div>
  )
}
