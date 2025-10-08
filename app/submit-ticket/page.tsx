"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SubmitTicketPage() {
  const router = useRouter()

  useEffect(() => {
    console.log("[v0] Submit ticket page loaded, opening Gmail")

    // Generate ticket ID
    const ticketId = `KST-${Date.now()}`
    console.log("[v0] Generated ticket ID:", ticketId)

    // Open Gmail with pre-filled recipient
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=heyroy23415@gmail.com`
    console.log("[v0] Opening Gmail:", gmailUrl)
    window.open(gmailUrl, "_blank")

    // Redirect back to home page
    console.log("[v0] Redirecting to home page")
    router.push("/")
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-4">Opening Gmail...</h1>
        <p className="text-muted-foreground">You will be redirected shortly.</p>
      </div>
    </div>
  )
}
