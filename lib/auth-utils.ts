import { cookies } from "next/headers"

export interface User {
  id: string
  email: string
  name: string
  image?: string
}

export interface Session {
  user: User
  accessToken: string
  expiresAt: number
}

export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get("session")

    if (!sessionCookie) {
      return null
    }

    const session: Session = JSON.parse(sessionCookie.value)

    // Check if session is expired
    if (session.expiresAt < Date.now()) {
      console.log("[v0] Session expired")
      cookieStore.delete("session")
      return null
    }

    return session
  } catch (error) {
    console.error("[v0] Error getting session:", error)
    return null
  }
}

export async function requireAuth(): Promise<Session> {
  const session = await getSession()

  if (!session) {
    throw new Error("Unauthorized")
  }

  return session
}
