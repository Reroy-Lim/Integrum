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
    // Check session from cookie by making a request to a session endpoint
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.session) {
          setSession(data.session)
          setStatus("authenticated")
        } else {
          setSession(null)
          setStatus("unauthenticated")
        }
      })
      .catch(() => {
        setSession(null)
        setStatus("unauthenticated")
      })
  }, [])

  const signOut = async () => {
    await fetch("/api/auth/signout", { method: "POST" })
    setSession(null)
    setStatus("unauthenticated")
    router.refresh()
  }

  return {
    data: session,
    status,
    signOut,
  }
}
