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

    console.log("[v0] getSession called, cookie exists:", !!sessionCookie)

    if (!sessionCookie) {
      console.log("[v0] No session cookie found")
      return null
    }

    console.log("[v0] Session cookie value length:", sessionCookie.value.length)

    const session: Session = JSON.parse(sessionCookie.value)

    console.log("[v0] Parsed session:", {
      email: session.user.email,
      expiresAt: new Date(session.expiresAt).toISOString(),
      isExpired: session.expiresAt < Date.now(),
    })

    // Check if session is expired
    if (session.expiresAt < Date.now()) {
      console.log("[v0] Session expired for user:", session.user.email)
      cookieStore.delete("session")
      return null
    }

    console.log("[v0] Returning valid session for user:", session.user.email)
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
