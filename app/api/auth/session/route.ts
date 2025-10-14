import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-utils"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("[v0] Session API: Fetching session")
    const session = await getSession()

    if (!session) {
      console.log("[v0] Session API: No session found")
      return NextResponse.json({ session: null })
    }

    console.log("[v0] Session API: Session found for user:", session.user.email)
    return NextResponse.json({
      session: {
        user: session.user,
      },
    })
  } catch (error) {
    console.error("[v0] Session API: Error getting session:", error)
    return NextResponse.json({ session: null })
  }
}
