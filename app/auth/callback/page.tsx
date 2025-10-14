"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      console.log("[v0] Auth callback page loaded")
      console.log("[v0] Current URL:", window.location.href)

      const params = new URLSearchParams(window.location.search)
      const sessionData = params.get("session")
      const callbackUrl = params.get("state") || "/"

      console.log("[v0] Callback params:", {
        hasSession: !!sessionData,
        sessionLength: sessionData?.length,
        callbackUrl,
      })

      if (sessionData) {
        try {
          // Decode and parse session
          console.log("[v0] Decoding session data...")
          const decoded = atob(sessionData)
          const session = JSON.parse(decoded)

          console.log("[v0] Session decoded:", {
            email: session.user?.email,
            name: session.user?.name,
            expiresAt: new Date(session.expiresAt).toISOString(),
          })

          // Store in localStorage
          localStorage.setItem("integrum_session", JSON.stringify(session))
          console.log("[v0] Session stored in localStorage")

          // Verify storage
          const stored = localStorage.getItem("integrum_session")
          console.log("[v0] Verification - session stored:", !!stored)

          // Small delay to ensure storage completes
          await new Promise((resolve) => setTimeout(resolve, 100))

          console.log("[v0] Redirecting to:", callbackUrl)
          router.push(callbackUrl)
        } catch (error) {
          console.error("[v0] Failed to store session:", error)
          router.push("/?error=auth_failed")
        }
      } else {
        console.error("[v0] No session data in callback URL")
        router.push("/?error=no_session")
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mb-4 text-lg font-medium">Completing sign in...</div>
        <div className="text-sm text-muted-foreground">Please wait while we set up your session</div>
      </div>
    </div>
  )
}
