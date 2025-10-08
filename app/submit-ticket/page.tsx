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

      // Open Gmail with pre-filled recipient
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=heyroy23415@gmail.com`
      window.open(gmailUrl, "_blank")

      console.log("[v0] Gmail opened, redirecting to home")

      router.push("/?showMessage=true")
    } else if (status === "unauthenticated") {
      console.log("[v0] User not authenticated, redirecting to home")
      // If somehow they reached this page without authentication, redirect home
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
