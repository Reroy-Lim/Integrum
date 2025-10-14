"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleCallback = async () => {
      console.log("[v0] Auth callback page loaded")

      // Get session data from query parameter
      const sessionData = searchParams.get("session")
      const callbackUrl = searchParams.get("state") || "/"

      console.log("[v0] Callback params:", {
        hasSession: !!sessionData,
        callbackUrl,
      })

      if (sessionData) {
        try {
          // Decode and parse session
          const decoded = atob(sessionData)
          const session = JSON.parse(decoded)

          console.log("[v0] Storing session in localStorage:", {
            email: session.user?.email,
            expiresAt: session.expiresAt,
          })

          // Store in localStorage
          localStorage.setItem("integrum_session", JSON.stringify(session))

          console.log("[v0] Session stored successfully")

          // Redirect to callback URL
          router.push(callbackUrl)
        } catch (error) {
          console.error("[v0] Failed to store session:", error)
          router.push("/?error=auth_failed")
        }
      } else {
        console.log("[v0] No session data in callback")
        router.push("/?error=no_session")
      }
    }

    handleCallback()
  }, [searchParams, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 text-lg font-medium">Completing sign in...</div>
        <div className="text-sm text-muted-foreground">Please wait while we set up your session</div>
      </div>
    </div>
  )
}
