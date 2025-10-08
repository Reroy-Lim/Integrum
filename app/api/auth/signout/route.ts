import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete("session")

  console.log("[v0] User signed out")

  return NextResponse.json({ success: true })
}

export async function GET() {
  const cookieStore = await cookies()
  cookieStore.delete("session")

  console.log("[v0] User signed out")

  const baseUrl = process.env.NEXTAUTH_URL?.trim() || "/"

  return NextResponse.redirect(baseUrl)
}
