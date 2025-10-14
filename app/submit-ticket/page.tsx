"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/use-session"

export default function SubmitTicketPage() {
  const router = useRouter()
  const { status } = useSession()
  const [gmailWindow, setGmailWindow] = useState<Window | null>(null)
  const [wasBlurred, setWasBlurred] = useState(false)
  const [justRegainedFocus, setJustRegainedFocus] = useState(false)

  useEffect(() => {
    console.log("[v0] Submit ticket page loaded, status:", status)

    if (status === "authenticated") {
      console.log("[v0] User authenticated, opening Gmail")

      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=heyroy23415@gmail.com`
      const newWindow = window.open(gmailUrl, "_blank")
      setGmailWindow(newWindow)

      console.log("[v0] Gmail opened, monitoring window focus")
    } else if (status === "unauthenticated") {
      console.log("[v0] User not authenticated, redirecting to home")
      router.push("/")
    }
  }, [status, router])

  useEffect(() => {
    const handleBlur = () => {
      console.log("[v0] Main window lost focus - user went to Gmail")
      setWasBlurred(true)
      setJustRegainedFocus(false)
    }

    const handleFocus = () => {
      if (wasBlurred) {
        console.log("[v0] Main window regained focus - auto-return from Gmail detected")
        setJustRegainedFocus(true)

        // Reset after 2 seconds to handle edge cases
        setTimeout(() => {
          setJustRegainedFocus(false)
        }, 2000)
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        console.log("[v0] Main window became hidden - user went to Gmail")
        setWasBlurred(true)
        setJustRegainedFocus(false)
      } else if (document.visibilityState === "visible" && wasBlurred) {
        console.log("[v0] Main window became visible - auto-return from Gmail detected")
        setJustRegainedFocus(true)

        setTimeout(() => {
          setJustRegainedFocus(false)
        }, 2000)
      }
    }

    window.addEventListener("blur", handleBlur)
    window.addEventListener("focus", handleFocus)
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener("blur", handleBlur)
      window.removeEventListener("focus", handleFocus)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [wasBlurred])

  useEffect(() => {
    if (!gmailWindow) return

    const checkInterval = setInterval(() => {
      if (gmailWindow.closed) {
        console.log("[v0] Gmail window closed")
        clearInterval(checkInterval)

        // If main window just regained focus (within last 2 seconds), it's auto-return from Gmail after sending
        if (justRegainedFocus) {
          console.log("[v0] Auto-return detected - user sent email and Gmail closed automatically")
          router.push("/?emailSent=true")
        } else {
          console.log("[v0] Manual close detected - user closed Gmail without sending")
          router.push("/?emailNotSent=true")
        }
      }
    }, 500)

    return () => clearInterval(checkInterval)
  }, [gmailWindow, justRegainedFocus, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Opening Gmail...</h2>
        <p className="text-muted-foreground">Please wait while we redirect you.</p>
      </div>
    </div>
  )
}
