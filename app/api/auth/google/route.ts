import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url)
    const callbackUrl = requestUrl.searchParams.get("callbackUrl") || "/"

    console.log("[v0] Auth request received, callback URL:", callbackUrl)
    console.log("[v0] Environment check:", {
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    })

    // Build Google OAuth URL
    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth")

    googleAuthUrl.searchParams.append("client_id", process.env.GOOGLE_CLIENT_ID!)
    googleAuthUrl.searchParams.append("redirect_uri", `${process.env.NEXTAUTH_URL}/api/auth/callback/google`)
    googleAuthUrl.searchParams.append("response_type", "code")
    googleAuthUrl.searchParams.append("scope", "openid email profile")
    googleAuthUrl.searchParams.append("access_type", "offline")
    googleAuthUrl.searchParams.append("prompt", "select_account") // This ensures "Choose an Account" page appears
    googleAuthUrl.searchParams.append("state", callbackUrl) // Store callback URL in state

    console.log("[v0] Redirecting to Google OAuth:", googleAuthUrl.toString())

    return NextResponse.redirect(googleAuthUrl.toString())
  } catch (error) {
    console.error("[v0] Error in Google auth route:", error)
    return NextResponse.json({ error: "Failed to initiate Google authentication" }, { status: 500 })
  }
}
