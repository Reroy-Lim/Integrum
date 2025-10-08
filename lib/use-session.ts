"use client"

import { useState } from "react"
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
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("unauthenticated")
  const router = useRouter()

  // This ensures the page always shows "Login" button on initial load for demo purposes

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
