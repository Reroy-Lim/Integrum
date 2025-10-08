import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

console.log("[v0] NextAuth route handler initializing...")

const handler = NextAuth(authOptions)

console.log("[v0] NextAuth handler created successfully")

export { handler as GET, handler as POST }
