"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/use-session"

export default function SubmitTicketPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    console.log("[v0] Submit ticket page loaded, status:", status)

    if (status === "authenticated") {
      console.log("[v0] User authenticated, opening Gmail")

      const userEmail = session?.user?.email
      const gmailUrl = userEmail
        ? `https://mail.google.com/mail/u/${userEmail}/?view=cm&fs=1&to=heyroy23415@gmail.com`
        : `https://mail.google.com/mail/?view=cm&fs=1&to=heyroy23415@gmail.com`

      const gmailWindow = window.open(gmailUrl, "_blank")

      // Store window reference timestamp to track this specific window
      if (gmailWindow) {
        sessionStorage.setItem("gmailWindowOpened", Date.now().toString())
        sessionStorage.setItem("gmailUrl", gmailUrl)
      }

      console.log("[v0] Gmail opened, redirecting to ticket processing page")

      router.push("/ticket-processing/pending")
    } else if (status === "unauthenticated") {
      console.log("[v0] User not authenticated, redirecting to home")
      router.push("/")
    }
  }, [status, router, session])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Opening Gmail...</h2>
        <p className="text-muted-foreground">Please wait while we redirect you.</p>
      </div>
    </div>
  )
}
