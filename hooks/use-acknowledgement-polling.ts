"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface AcknowledgementData {
  ticketId: string
  messageId: string
  timestamp: string
  acknowledged: boolean
  verified: boolean
}

export function useAcknowledgementPolling(userEmail: string | null, enabled = true) {
  const [acknowledgement, setAcknowledgement] = useState<AcknowledgementData | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!userEmail || !enabled) return

    let intervalId: NodeJS.Timeout

    const checkAcknowledgement = async () => {
      try {
        setIsPolling(true)
        const response = await fetch(`/api/acknowledgement/status?email=${encodeURIComponent(userEmail)}`)
        const result = await response.json()

        if (result.success && result.acknowledged && result.verified) {
          // New acknowledgement received
          if (!acknowledgement || acknowledgement.ticketId !== result.data.ticketId) {
            setAcknowledgement(result.data)

            // Show toast notification
            toast({
              title: "Auto-Acknowledgement Received! 🎉",
              description: `Your ticket ${result.data.ticketId} has been acknowledged. The proposal has been linked to your ticket.`,
              duration: 10000,
            })
          }
        }
      } catch (error) {
        console.error("Error checking acknowledgement:", error)
      } finally {
        setIsPolling(false)
      }
    }

    // Check immediately
    checkAcknowledgement()

    // Then poll every 30 seconds
    intervalId = setInterval(checkAcknowledgement, 30000)

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [userEmail, enabled, acknowledgement, toast])

  return { acknowledgement, isPolling }
}
