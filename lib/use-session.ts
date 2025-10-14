"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export interface User {
  id: string
  email: string
  name: string
  image?: string
}

export interface Session {
  user: User
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading")
  const router = useRouter()

  useEffect(() => {
    console.log("[v0] useSession: Starting session check")

    if (typeof window !== "undefined" && window.location.hash.includes("session=")) {
      console.log("[v0] useSession: Found session in URL hash")
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const sessionParam = hashParams.get("session")
        if (sessionParam) {
          const sessionData = JSON.parse(atob(decodeURIComponent(sessionParam)))
          console.log("[v0] useSession: Parsed session from hash:", {
            email: sessionData.user?.email,
            name: sessionData.user?.name,
            expiresAt: new Date(sessionData.expiresAt).toISOString(),
          })

          // Store in localStorage for persistence
          localStorage.setItem("integrum_session", JSON.stringify(sessionData))
          console.log("[v0] useSession: ✓ Stored session in localStorage")

          // Clear hash from URL
          window.history.replaceState(null, "", window.location.pathname + window.location.search)

          setSession({ user: sessionData.user })
          setStatus("authenticated")
          console.log("[v0] useSession: ✓ Session authenticated from URL hash:", sessionData.user.email)
          return
        }
      } catch (error) {
        console.error("[v0] useSession: ✗ Failed to parse session from hash:", error)
      }
    }

    if (typeof window !== "undefined") {
      console.log("[v0] useSession: Checking localStorage for session")
      try {
        const stored = localStorage.getItem("integrum_session")

        if (stored) {
          const sessionData = JSON.parse(stored)
          const isExpired = sessionData.expiresAt && sessionData.expiresAt < Date.now()

          console.log("[v0] useSession: Found localStorage session:", {
            email: sessionData.user?.email,
            expiresAt: new Date(sessionData.expiresAt).toISOString(),
            isExpired,
            timeRemaining: sessionData.expiresAt
              ? Math.floor((sessionData.expiresAt - Date.now()) / 1000 / 60) + " minutes"
              : "N/A",
          })

          if (!isExpired) {
            setSession({ user: sessionData.user })
            setStatus("authenticated")
            console.log("[v0] useSession: ✓ Session authenticated from localStorage:", sessionData.user.email)
            return
          } else {
            localStorage.removeItem("integrum_session")
            console.log("[v0] useSession: ✗ Session expired, cleared from localStorage")
          }
        } else {
          console.log("[v0] useSession: No session in localStorage")
        }
      } catch (error) {
        console.error("[v0] useSession: ✗ Failed to load session from localStorage:", error)
        localStorage.removeItem("integrum_session")
      }
    }

    console.log("[v0] useSession: Falling back to server cookie check")
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.session) {
          setSession(data.session)
          setStatus("authenticated")
          console.log("[v0] useSession: ✓ Session authenticated from server:", data.session.user.email)
        } else {
          setSession(null)
          setStatus("unauthenticated")
          console.log("[v0] useSession: ✗ No session found from any source")
        }
      })
      .catch((error) => {
        console.error("[v0] useSession: ✗ Server session check failed:", error)
        setSession(null)
        setStatus("unauthenticated")
      })
  }, [])

  const signOut = async () => {
    console.log("[v0] useSession: Signing out")
    if (typeof window !== "undefined") {
      localStorage.removeItem("integrum_session")
      console.log("[v0] useSession: ✓ Cleared localStorage")
    }
    await fetch("/api/auth/signout", { method: "POST" })
    setSession(null)
    setStatus("unauthenticated")
    router.push("/")
  }

  return {
    data: session,
    status,
    signOut,
  }
}
