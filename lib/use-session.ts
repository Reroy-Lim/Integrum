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
    if (typeof window !== "undefined" && window.location.hash.includes("session=")) {
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const sessionParam = hashParams.get("session")
        if (sessionParam) {
          const sessionData = JSON.parse(atob(decodeURIComponent(sessionParam)))
          // Store in localStorage for persistence
          localStorage.setItem("integrum_session", JSON.stringify(sessionData))
          // Clear hash from URL
          window.history.replaceState(null, "", window.location.pathname + window.location.search)
          setSession({ user: sessionData.user })
          setStatus("authenticated")
          console.log("[v0] Session loaded from URL hash:", sessionData.user.email)
          return
        }
      } catch (error) {
        console.error("[v0] Failed to parse session from hash:", error)
      }
    }

    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("integrum_session")
        if (stored) {
          const sessionData = JSON.parse(stored)
          // Check if expired
          if (sessionData.expiresAt && sessionData.expiresAt > Date.now()) {
            setSession({ user: sessionData.user })
            setStatus("authenticated")
            console.log("[v0] Session loaded from localStorage:", sessionData.user.email)
            return
          } else {
            localStorage.removeItem("integrum_session")
            console.log("[v0] Session expired, cleared from localStorage")
          }
        }
      } catch (error) {
        console.error("[v0] Failed to load session from localStorage:", error)
      }
    }

    // Fallback: Check session from server cookie
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.session) {
          setSession(data.session)
          setStatus("authenticated")
          console.log("[v0] Session loaded from server:", data.session.user.email)
        } else {
          setSession(null)
          setStatus("unauthenticated")
          console.log("[v0] No session found")
        }
      })
      .catch(() => {
        setSession(null)
        setStatus("unauthenticated")
      })
  }, [])

  const signOut = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("integrum_session")
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
