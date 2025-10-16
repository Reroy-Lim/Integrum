"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/use-session"
import { Loader2, Mail } from "lucide-react"

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

      window.open(gmailUrl, "_blank")

      console.log("[v0] Gmail opened, redirecting to ticket processing page")

      router.push("/ticket-processing/pending")
    } else if (status === "unauthenticated") {
      console.log("[v0] User not authenticated, redirecting to home")
      router.push("/")
    }
  }, [status, router, session])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950">
      <div className="text-center space-y-4">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <Loader2 className="w-16 h-16 text-primary animate-spin" />
            <Mail className="w-8 h-8 text-accent absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-foreground">Opening Gmail...</h2>
        <p className="text-muted-foreground">Please wait while we redirect you.</p>
      </div>
    </div>
  )
}
