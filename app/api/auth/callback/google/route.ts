import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state") || "/"
  const error = searchParams.get("error")

  const baseUrl = process.env.NEXTAUTH_URL?.trim() || ""

  console.log("[v0] OAuth callback received:", { code: !!code, error, state })

  if (error) {
    console.error("[v0] OAuth error:", error)
    return NextResponse.redirect(`${baseUrl}/?error=${error}`)
  }

  if (!code) {
    console.error("[v0] No authorization code received")
    return NextResponse.redirect(`${baseUrl}/?error=no_code`)
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${baseUrl}/api/auth/callback/google`,
        grant_type: "authorization_code",
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error("[v0] Token exchange failed:", errorData)
      throw new Error("Failed to exchange code for tokens")
    }

    const tokens = await tokenResponse.json()
    console.log("[v0] Tokens received:", { access_token: !!tokens.access_token, id_token: !!tokens.id_token })

    // Get user info
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })

    if (!userInfoResponse.ok) {
      throw new Error("Failed to get user info")
    }

    const userInfo = await userInfoResponse.json()
    console.log("[v0] User info received:", { email: userInfo.email, name: userInfo.name })

    // Create session cookie
    const cookieStore = await cookies()
    const sessionData = {
      user: {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        image: userInfo.picture,
      },
      accessToken: tokens.access_token,
      expiresAt: Date.now() + tokens.expires_in * 1000,
    }

    cookieStore.set("session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: tokens.expires_in,
      path: "/",
    })

    console.log("[v0] Session created, redirecting to:", state)

    // Redirect to the original callback URL
    return NextResponse.redirect(`${baseUrl}${state}`)
  } catch (error) {
    console.error("[v0] OAuth callback error:", error)
    return NextResponse.redirect(`${baseUrl}/?error=callback_failed`)
  }
}
