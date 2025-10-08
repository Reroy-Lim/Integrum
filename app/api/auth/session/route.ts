import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth-utils"

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ session: null })
    }

    return NextResponse.json({
      session: {
        user: session.user,
      },
    })
  } catch (error) {
    console.error("[v0] Session check error:", error)
    return NextResponse.json({ session: null })
  }
}
