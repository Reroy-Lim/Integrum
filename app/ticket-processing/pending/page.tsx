"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "@/lib/use-session"
import { Loader2, Mail } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import Image from "next/image"

export default function PendingTicketPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const userEmail = session?.user?.email

  const submittedAt = searchParams.get("submittedAt")
  const submissionTime = submittedAt ? Number.parseInt(submittedAt, 10) : Date.now()

  const [elapsedTime, setElapsedTime] = useState(0)
  const [foundTicket, setFoundTicket] = useState(false)
  const [checkCount, setCheckCount] = useState(0)
  const [networkSpeed, setNetworkSpeed] = useState<number | null>(null)

  useEffect(() => {
    if (!userEmail || foundTicket) return

    const measureSpeed = async () => {
      try {
        // Try Network Information API first
        if ("connection" in navigator && "downlink" in (navigator as any).connection) {
          const connection = (navigator as any).connection
          setNetworkSpeed(connection.downlink)
          console.log("[v0] Network speed from API:", connection.downlink, "Mbps")
          return
        }

        // Fallback: measure download speed with a small fetch
        const testFileSize = 50000 // 50KB test
        const startTime = performance.now()

        const response = await fetch("/placeholder.svg?height=100&width=100", {
          cache: "no-store",
          method: "GET",
        })

        if (!response.ok) throw new Error("Speed test failed")

        await response.blob()

        const endTime = performance.now()
        const durationInSeconds = (endTime - startTime) / 1000

        const bitsLoaded = testFileSize * 8
        const speedMbps = bitsLoaded / durationInSeconds / 1000000

        setNetworkSpeed(Math.max(0.1, Math.min(speedMbps, 1000))) // Cap between 0.1 and 1000 Mbps
        console.log("[v0] Measured network speed:", speedMbps.toFixed(1), "Mbps")
      } catch (error) {
        console.error("[v0] Failed to measure network speed:", error)
        setNetworkSpeed(null)
      }
    }

    // Measure immediately on mount
    measureSpeed()

    // Continue measuring every 3 seconds
    const speedInterval = setInterval(measureSpeed, 3000)

    // Cleanup: stop measuring when component unmounts or ticket is found
    return () => {
      clearInterval(speedInterval)
    }
  }, [userEmail, foundTicket])

  useEffect(() => {
    if (foundTicket) return

    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [foundTicket])

  const [tickets, setTickets] = useState([])

  useEffect(() => {
    if (!userEmail) return

    const checkForNewTicket = async () => {
      try {
        setCheckCount((prev) => prev + 1)
        console.log("[v0] Checking for new tickets (attempt #" + (checkCount + 1) + ") for user:", userEmail)
        console.log("[v0] Only accepting tickets created after:", new Date(submissionTime).toISOString())

        const response = await fetch(`/api/jira/tickets?email=${encodeURIComponent(userEmail)}&limit=1`)

        if (!response.ok) {
          console.error("[v0] Failed to fetch tickets")
          return
        }

        const data = await response.json()

        if (data.tickets && data.tickets.length > 0) {
          const latestTicket = data.tickets[0]
          const ticketCreatedTime = new Date(latestTicket.created).getTime()

          if (ticketCreatedTime >= submissionTime) {
            console.log(
              "[v0] Found new ticket:",
              latestTicket.key,
              "Created:",
              new Date(latestTicket.created).toISOString(),
            )
            setFoundTicket(true)

            setTimeout(() => {
              router.push(`/ticket-processing/${latestTicket.key}`)
            }, 500)
          } else {
            const timeDiff = Math.floor((submissionTime - ticketCreatedTime) / 1000)
            console.log(
              "[v0] Latest ticket is too old:",
              latestTicket.key,
              "Created",
              timeDiff,
              "seconds before submission",
            )
          }
        } else {
          console.log("[v0] No tickets found yet")
        }
      } catch (error) {
        console.error("[v0] Error checking for new tickets:", error)
      }
    }

    const initialTimeout = setTimeout(checkForNewTicket, 1000)

    const pollInterval = setInterval(checkForNewTicket, 2000)

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(pollInterval)
    }
  }, [userEmail, router, checkCount, submissionTime])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleReturnHome = () => {
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-white/95 backdrop-blur shadow-2xl relative">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="flex justify-center">
            <div className="relative">
              <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
              <Mail className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">Ticket is being created...</CardTitle>
          <p className="text-gray-600">Your ticket is being processed. Please be patient.</p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">Processing time</p>
            <p className="text-3xl font-mono font-bold text-blue-600">{formatTime(elapsedTime)}</p>
            <div className="flex flex-col items-center gap-1 mt-3">
              <div className="flex items-center gap-4">
                <p className="text-xs text-gray-400">Checks: {checkCount}</p>
                <span className="text-xs text-gray-300">|</span>
                <p className="text-xs text-gray-400">
                  Internet Speed: {networkSpeed !== null ? `${networkSpeed.toFixed(1)} Mbps` : "Unknown"}
                </p>
              </div>
              {networkSpeed !== null && networkSpeed < 5 && (
                <p className="text-xs text-orange-500 mt-1">A lower speed may increase loading time.</p>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 relative">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleReturnHome}
                    className="absolute top-2 right-2 w-12 h-12 rounded-full bg-gradient-to-br from-red-400 to-orange-500 hover:from-red-500 hover:to-orange-600 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer flex items-center justify-center animate-pulse hover:animate-none hover:scale-110 ring-2 ring-red-300 ring-offset-2"
                    aria-label="Return to home"
                  >
                    <Image
                      src="/error-illustration.png"
                      alt="Return to home"
                      width={32}
                      height={32}
                      className="w-8 h-8 object-contain drop-shadow-md"
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-center">
                    Having issue on sending Email?
                    <br />
                    Don't worry, Click on this Error Icon Button to return back to Home Page!
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <p className="text-sm text-blue-700 mb-2 font-medium">What's happening?</p>
            <ul className="text-xs text-blue-600 space-y-1">
              <li>• Waiting for your email to arrive</li>
              <li>• Creating ticket in Jira system</li>
              <li>• Analyzing issue with AI</li>
              <li>• Generating auto-acknowledgement</li>
            </ul>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              <p className="text-sm text-gray-600">
                This usually takes 5-10 minutes (Excluding the time of writing the emails).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
