"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ReviewTicketsPage() {
  const router = useRouter()

  useEffect(() => {
    console.log("[v0] Review tickets page loaded, redirecting to tickets view")
    // Redirect to home page with view=yourTickets query parameter
    router.push("/?view=yourTickets")
  }, [router])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p>Loading your tickets...</p>
      </div>
    </div>
  )
}
