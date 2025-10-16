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
    console.log("[v0] useSession: Fetching session from /api/auth/session")

    // Check session from cookie by making a request to a session endpoint
    fetch("/api/auth/session")
      .then((res) => {
        console.log("[v0] useSession: Response status:", res.status)
        return res.json()
      })
      .then((data) => {
        console.log("[v0] useSession: Response data:", data)
        if (data.session) {
          console.log("[v0] useSession: Session found for user:", data.session.user.email)
          setSession(data.session)
          setStatus("authenticated")
        } else {
          console.log("[v0] useSession: No session in response")
          setSession(null)
          setStatus("unauthenticated")
        }
      })
      .catch((error) => {
        console.error("[v0] useSession: Error fetching session:", error)
        setSession(null)
        setStatus("unauthenticated")
      })
  }, [])

  const signOut = async () => {
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
