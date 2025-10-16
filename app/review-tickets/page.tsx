"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Ticket } from "lucide-react"

export default function ReviewTicketsPage() {
  const router = useRouter()

  useEffect(() => {
    console.log("[v0] Review tickets page loaded, redirecting to tickets view")
    router.push("/?view=yourTickets")
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <Loader2 className="w-16 h-16 text-primary animate-spin" />
            <Ticket className="w-8 h-8 text-accent absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-foreground">Loading your tickets...</h2>
        <p className="text-muted-foreground">Please wait while we fetch your data.</p>
      </div>
    </div>
  )
}
