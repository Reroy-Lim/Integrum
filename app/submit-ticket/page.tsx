"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/use-session"

export default function SubmitTicketPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [pendingTicketId, setPendingTicketId] = useState<string | null>(null)

  useEffect(() => {
    console.log("[v0] Submit ticket page loaded, status:", status)

    if (status === "authenticated" && session?.user?.email) {
      const initializeTicketSubmission = async () => {
        try {
          const response = await fetch("/api/pending-tickets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userEmail: session.user.email,
              emailTimestamp: Date.now(),
            }),
          })

          if (response.ok) {
            const data = await response.json()
            const ticketId = data.pendingTicket.id
            setPendingTicketId(ticketId)

            console.log("[v0] Created pending ticket:", ticketId)

            const userEmail = session.user.email
            const gmailUrl = `https://mail.google.com/mail/u/${userEmail}/?view=cm&fs=1&to=heyroy23415@gmail.com`

            window.open(gmailUrl, "_blank")

            console.log("[v0] Gmail opened, redirecting to status page")

            router.push(`/ticket-status/${ticketId}`)
          } else {
            console.error("[v0] Failed to create pending ticket")
            router.push("/?error=ticket-creation-failed")
          }
        } catch (error) {
          console.error("[v0] Error initializing ticket submission:", error)
          router.push("/?error=ticket-creation-failed")
        }
      }

      initializeTicketSubmission()
    } else if (status === "unauthenticated") {
      console.log("[v0] User not authenticated, redirecting to home")
      router.push("/")
    }
  }, [status, router, session])

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2 text-white">Opening Gmail...</h2>
        <p className="text-gray-400">Please wait while we prepare your ticket submission.</p>
      </div>
    </div>
  )
}
