"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface AuthButtonProps {
  session: { user: { name: string; email: string; image?: string } } | null
}

export function AuthButton({ session }: AuthButtonProps) {
  const router = useRouter()

  const handleSignIn = () => {
    window.location.href = "/api/auth/google"
  }

  const handleSignOut = async () => {
    await fetch("/api/auth/signout", { method: "POST" })
    router.refresh()
  }

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {session.user.image && (
            <img
              src={session.user.image || "/placeholder.svg"}
              alt={session.user.name}
              className="w-8 h-8 rounded-full"
            />
          )}
          <div className="text-sm">
            <div className="font-medium">{session.user.name}</div>
            <div className="text-muted-foreground">{session.user.email}</div>
          </div>
        </div>
        <Button onClick={handleSignOut} variant="outline">
          Sign Out
        </Button>
      </div>
    )
  }

  return <Button onClick={handleSignIn}>Sign in with Google</Button>
}
