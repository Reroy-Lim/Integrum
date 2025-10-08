import type { NextAuthOptions } from "next-auth"

console.log("[v0] Auth config loading...")
console.log("[v0] GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? "✓ Set" : "✗ Missing")
console.log("[v0] GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET ? "✓ Set" : "✗ Missing")
console.log("[v0] NEXTAUTH_SECRET:", process.env.NEXTAUTH_SECRET ? "✓ Set" : "✗ Missing")

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: "google",
      name: "Google",
      type: "oauth",
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        url: "https://accounts.google.com/o/oauth2/v2/auth",
        params: {
          scope: "openid email profile",
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
        },
      },
      token: "https://oauth2.googleapis.com/token",
      userinfo: "https://www.googleapis.com/oauth2/v3/userinfo",
      profile(profile) {
        console.log("[v0] Google profile received:", profile)
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        }
      },
    },
  ],
  callbacks: {
    async session({ session, token }) {
      console.log("[v0] Session callback - token:", token)
      if (session.user) {
        session.user.id = token.sub as string
      }
      return session
    },
    async signIn({ user, account, profile }) {
      console.log("[v0] Sign in callback - user:", user, "account:", account)
      return true
    },
    async redirect({ url, baseUrl }) {
      console.log("[v0] Redirect callback - url:", url, "baseUrl:", baseUrl)
      return url.startsWith(baseUrl) ? url : baseUrl
    },
  },
  pages: {
    signIn: "/",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: true,
}

console.log("[v0] Auth config loaded successfully")
