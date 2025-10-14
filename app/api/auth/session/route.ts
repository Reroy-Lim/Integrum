import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-utils"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ session: null })
    }

    return NextResponse.json({
      session: {
        user: session.user,
        accessToken: session.accessToken,
      },
    })
  } catch (error) {
    console.error("[v0] Error getting session:", error)
    return NextResponse.json({ session: null })
  }
}
