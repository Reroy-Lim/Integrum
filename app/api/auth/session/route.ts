import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-utils"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    console.log("[v0] Session endpoint called")
    const session = await getSession()

    if (!session) {
      console.log("[v0] No session found, returning null")
      return NextResponse.json({ session: null })
    }

    console.log("[v0] Returning session for user:", session.user.email)
    return NextResponse.json({
      session: {
        user: session.user,
      },
    })
  } catch (error) {
    console.error("[v0] Error getting session:", error)
    return NextResponse.json({ session: null })
  }
}
