"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Chrome } from "lucide-react"

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)
      setError(null)

      console.log("[v0] Initiating Google sign in...")

      const result = await signIn("google", {
        callbackUrl: "/",
        redirect: true,
      })

      console.log("[v0] Sign in result:", result)

      if (result?.error) {
        console.error("[v0] Sign in error:", result.error)
        console.log("[v0] Opening Google OAuth in new tab as fallback...")

        // Open OAuth in new tab
        const authUrl = `/api/auth/signin/google?callbackUrl=${encodeURIComponent("/")}`
        window.open(authUrl, "_blank", "width=500,height=600")

        setError("Please complete sign in in the new tab that opened.")
      }

      setIsLoading(false)
    } catch (error) {
      console.error("[v0] Sign in failed:", error)

      console.log("[v0] Opening Google OAuth in new tab as fallback...")
      const authUrl = `/api/auth/signin/google?callbackUrl=${encodeURIComponent("/")}`
      window.open(authUrl, "_blank", "width=500,height=600")

      setError("Please complete sign in in the new tab that opened.")
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Welcome to Integrum</CardTitle>
        <CardDescription>Sign in with your Google account to continue</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800 border border-blue-200">{error}</div>
        )}
        <Button variant="outline" className="w-full bg-transparent" onClick={handleGoogleSignIn} disabled={isLoading}>
          <Chrome className="mr-2 h-4 w-4" />
          {isLoading ? "Signing in..." : "Sign in with Google"}
        </Button>
      </CardContent>
    </Card>
  )
}
