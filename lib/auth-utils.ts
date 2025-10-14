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

    console.log("[v0] getSession: Cookie check", {
      hasCookie: !!sessionCookie,
      cookieValue: sessionCookie?.value ? "present" : "missing",
    })

    if (!sessionCookie) {
      console.log("[v0] getSession: No session cookie found")
      return null
    }

    const session: Session = JSON.parse(sessionCookie.value)

    console.log("[v0] getSession: Parsed session", {
      hasUser: !!session.user,
      userEmail: session.user?.email,
      expiresAt: new Date(session.expiresAt).toISOString(),
      isExpired: session.expiresAt < Date.now(),
    })

    // Check if session is expired
    if (session.expiresAt < Date.now()) {
      console.log("[v0] getSession: Session expired, deleting cookie")
      cookieStore.delete("session")
      return null
    }

    console.log("[v0] getSession: Valid session found for", session.user.email)
    return session
  } catch (error) {
    console.error("[v0] getSession: Error getting session:", error)
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
