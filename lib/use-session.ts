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
    console.log("[v0] useSession: Checking localStorage")

    if (typeof window === "undefined") {
      setStatus("unauthenticated")
      return
    }

    try {
      const stored = localStorage.getItem("integrum_session")

      if (stored) {
        const sessionData = JSON.parse(stored)
        console.log("[v0] useSession: Found session:", {
          email: sessionData.user?.email,
          expiresAt: sessionData.expiresAt,
          isExpired: sessionData.expiresAt ? sessionData.expiresAt < Date.now() : false,
        })

        // Check if expired
        if (!sessionData.expiresAt || sessionData.expiresAt > Date.now()) {
          setSession({ user: sessionData.user })
          setStatus("authenticated")
          console.log("[v0] useSession: Session loaded successfully")
        } else {
          localStorage.removeItem("integrum_session")
          setSession(null)
          setStatus("unauthenticated")
          console.log("[v0] useSession: Session expired")
        }
      } else {
        setSession(null)
        setStatus("unauthenticated")
        console.log("[v0] useSession: No session found")
      }
    } catch (error) {
      console.error("[v0] useSession: Error loading session:", error)
      setSession(null)
      setStatus("unauthenticated")
    }
  }, [])

  const signOut = async () => {
    console.log("[v0] useSession: Signing out")
    if (typeof window !== "undefined") {
      localStorage.removeItem("integrum_session")
    }
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
