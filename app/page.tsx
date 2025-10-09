"use client"

import { useState, useEffect } from "react"
import { useSession } from "@/lib/use-session"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Loader2, Mail, User, AlertCircle } from "@/components/icons"
import { Zap, Home, FileText, HelpCircle, Phone, Shield, Key, Lightbulb, ChevronDown } from "lucide-react"
import { GmailFlowDialog } from "@/components/gmail-flow-dialog"
import { GoogleSignInModal } from "@/components/google-signin-modal"
import { LogoutConfirmationDialog } from "@/components/logout-confirmation-dialog"
import { useSearchParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import type { JiraTicket } from "@/lib/jira-api"

const SnowAnimation = () => {
  const snowflakes = Array.from({ length: 50 }, (_, i) => (
    <div
      key={i}
      className="absolute animate-pulse"
      style={{
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 3}s`,
        animationDuration: `${3 + Math.random() * 2}s`,
      }}
    >
      <div
        className="w-3 h-3 bg-white rounded-full opacity-70"
        style={{
          animation: `snowfall ${3 + Math.random() * 2}s linear infinite`,
        }}
      />
    </div>
  ))

  return (
    <>
      <style jsx>{`
        @keyframes snowfall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">{snowflakes}</div>
    </>
  )
}

export default function IntegrumPortal() {
  const { data: session, status, signOut } = useSession()
  const isAuthenticated = status === "authenticated"
  const isLoading = status === "loading"
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [currentView, setCurrentView] = useState("home")
  const [currentTicketId, setCurrentTicketId] = useState("")
  const [accounts, setAccounts] = useState([])
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false)
  const [accountsError, setAccountsError] = useState(null)
  const [openItems, setOpenItems] = useState<string[]>([])
  const [showGoogleSignIn, setShowGoogleSignIn] = useState(false)
  const [googleSignInType, setGoogleSignInType] = useState<"submit" | "review">("submit")
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [showGmailFlow, setShowGmailFlow] = useState(false)
  const [showAcknowledgement, setShowAcknowledgement] = useState(false)
  const [showSecurityDialog, setShowSecurityDialog] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false)
  const [showEmailNotSent, setShowEmailNotSent] = useState(false)

  const [tickets, setTickets] = useState<JiraTicket[]>([])
  const [isLoadingTickets, setIsLoadingTickets] = useState(false)
  const [ticketsError, setTicketsError] = useState<string | null>(null)

  const userEmail = session?.user?.email || ""

  useEffect(() => {
    const fetchTickets = async () => {
      if (!userEmail) {
        setTickets([])
        return
      }

      setIsLoadingTickets(true)
      setTicketsError(null)

      try {
        console.log("[v0] Fetching tickets for user:", userEmail)
        const response = await fetch(`/api/jira/tickets?email=${encodeURIComponent(userEmail)}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch tickets: ${response.statusText}`)
        }

        const data = await response.json()
        console.log("[v0] Fetched tickets:", data.tickets?.length || 0)
        setTickets(data.tickets || [])
      } catch (error) {
        console.error("[v0] Error fetching tickets:", error)
        setTicketsError(error instanceof Error ? error.message : "Failed to fetch tickets")
      } finally {
        setIsLoadingTickets(false)
      }
    }

    fetchTickets()

    const intervalId = setInterval(fetchTickets, 30000)
    return () => clearInterval(intervalId)
  }, [userEmail])

  const refreshTickets = async () => {
    if (!userEmail) return

    setIsLoadingTickets(true)
    setTicketsError(null)

    try {
      const response = await fetch(`/api/jira/tickets?email=${encodeURIComponent(userEmail)}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch tickets: ${response.statusText}`)
      }

      const data = await response.json()
      setTickets(data.tickets || [])
    } catch (error) {
      console.error("[v0] Error refreshing tickets:", error)
      setTicketsError(error instanceof Error ? error.message : "Failed to refresh tickets")
    } finally {
      setIsLoadingTickets(false)
    }
  }

  const mapStatusToCategory = (status: string): string => {
    if (!status || typeof status !== "string") {
      return "In Progression"
    }

    const statusLower = status.toLowerCase()

    if (statusLower.includes("progress") || statusLower.includes("development") || statusLower.includes("review")) {
      return "In Progression"
    }

    if (statusLower.includes("done") || statusLower.includes("resolved") || statusLower.includes("closed")) {
      return "Resolved"
    }

    if (statusLower.includes("waiting") || statusLower.includes("pending") || statusLower.includes("feedback")) {
      return "Pending Reply"
    }

    return "In Progression"
  }

  const handleGoogleAuth = () => {
    window.location.href = "/api/auth/google"
  }

  const handleAccountSelect = (account: any) => {
    if (account.signedOut) {
      window.open("https://mail.google.com/mail/?view=cm&to=heyroy23415@gmail.com", "_blank")
      return
    }

    proceedWithAuthentication(account)
  }

  const proceedWithAuthentication = (account: any) => {
    setSelectedAccount(account)

    if (googleSignInType === "submit") {
      const gmailUrl = `https://mail.google.com/mail/?view=cm&to=heyroy23415@gmail.com&authuser=${encodeURIComponent(account.email)}`
      window.open(gmailUrl, "_blank")
    } else if (googleSignInType === "review") {
      setCurrentView("yourTickets")
    }

    setGoogleSignInType(null)
    setShowGoogleSignIn(false)
  }

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && status !== "authenticated") {
        setCurrentView("home")
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [status])

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const view = urlParams.get("view")
    const ticket = urlParams.get("ticket")
    const timestamp = urlParams.get("timestamp")
    const processing = urlParams.get("processing")

    console.log("[v0] Page loaded, pathname:", window.location.pathname, "authenticated:", isAuthenticated)

    if (window.location.pathname === "/submit-ticket" && isAuthenticated) {
      console.log("[v0] Detected submit-ticket intent after OAuth, auto-opening Gmail")
      const gmailUrl = `https://mail.google.com/mail/?view=cm&to=heyroy23415@gmail.com`

      console.log("[v0] Opening Gmail URL:", gmailUrl)
      window.open(gmailUrl, "_blank")

      console.log("[v0] Redirecting main window to home page")
      window.location.href = "/"
      return
    }

    if (view === "yourTickets") {
      if (processing === "true" && ticket && timestamp) {
        console.log("[v0] Immediate redirect from Gmail submission, showing processing state")
        setCurrentView("yourTickets")
        setTimeout(() => {
          window.history.replaceState({}, "", window.location.pathname)
        }, 1000)
      } else if (ticket && timestamp) {
        const submissionTime = Number.parseInt(timestamp)
        const currentTime = Date.now()
        const timeDifference = Math.abs(currentTime - submissionTime)
        const maxTimeDifference = 10 * 60 * 1000

        if (timeDifference <= maxTimeDifference) {
          console.log("[v0] Valid return from Gmail, showing ticket page")
          setCurrentView("yourTickets")
          window.history.replaceState({}, "", window.location.pathname)
        } else {
          console.log("[v0] Timestamp too old, invalid return from Gmail")
          alert("The return link has expired. Please submit a new ticket.")
        }
      } else {
        setCurrentView("yourTickets")
      }
    }
  }, [])

  useEffect(() => {
    const emailNotSent = searchParams.get("emailNotSent")
    const ticketSent = searchParams.get("ticketSent")

    if (emailNotSent === "true") {
      setShowEmailNotSent(true)
      window.history.replaceState({}, "", "/")
    } else if (ticketSent === "true") {
      setShowSuccessMessage(true)
      window.history.replaceState({}, "", "/")
    }
  }, [searchParams])

  useEffect(() => {
    const ticketSent = searchParams.get("ticketSent")
    if (ticketSent === "true") {
      setShowSuccessMessage(true)
      window.history.replaceState({}, "", "/")
    }
  }, [searchParams])

  const handleSubmitTicket = () => {
    console.log("[v0] Submit ticket clicked, authenticated:", isAuthenticated)

    if (!isAuthenticated) {
      console.log("[v0] Not authenticated, redirecting to OAuth with /submit-ticket callback")
      window.location.href = "/api/auth/google?callbackUrl=/submit-ticket"
      return
    }

    console.log("[v0] Already authenticated, redirecting to /submit-ticket page")
    window.location.href = "/submit-ticket"
  }

  const handleReviewTickets = () => {
    if (!isAuthenticated) {
      console.log("[v0] Not authenticated, redirecting to OAuth with /review-tickets callback")
      window.location.href = "/api/auth/google?callbackUrl=/review-tickets"
      return
    }

    setCurrentView("yourTickets")
  }

  const handleAcknowledgementClose = () => {
    setShowAcknowledgement(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress":
        return "bg-blue-500"
      case "Resolved":
        return "bg-green-500"
      case "Awaiting Reply":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  const renderSecurityDialog = () => (
    <Dialog open={showSecurityDialog} onOpenChange={() => setShowSecurityDialog(!showSecurityDialog)}>
      <DialogContent className="max-w-md w-full bg-white">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <DialogTitle className="text-xl font-semibold text-center text-gray-800">
            Additional Security Required
          </DialogTitle>
          <p className="text-sm text-gray-600 text-center">
            This account is signed out. Please verify your identity with additional security measures.
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Key className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">Security Verification Required</span>
            </div>
            <p className="text-xs text-yellow-700">
              Please enter your Google account password and complete additional authentication (passkey, 2FA, etc.) to
              continue.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Google Account Password
              </Label>
              <Input id="password" type="password" placeholder="Enter your password" className="mt-1" />
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700">
                After entering your password, you may be prompted for additional verification such as:
              </p>
              <ul className="text-xs text-blue-600 mt-1 ml-4 list-disc">
                <li>Passkey authentication</li>
                <li>Two-factor authentication (2FA)</li>
                <li>SMS verification code</li>
              </ul>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button variant="outline" size="sm" onClick={() => setShowSecurityDialog(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={() => setShowSecurityDialog(false)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Verify & Continue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  const renderSuccessMessageDialog = () => (
    <Dialog open={showSuccessMessage} onOpenChange={setShowSuccessMessage}>
      <DialogContent className="max-w-md w-full bg-white">
        <DialogHeader className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <DialogTitle className="text-xl font-semibold text-center text-gray-800">Email Sent Successfully</DialogTitle>
        </DialogHeader>

        <DialogDescription className="text-center space-y-4">
          <p className="text-gray-600">
            Thank you for sending your Integrum email. You will receive a separate automatic acknowledgment email.
          </p>
          <p className="text-gray-600">
            The arrival of this email confirms that we have successfully received your request, and a proposal will be
            linked to your ticket.
          </p>
        </DialogDescription>

        <div className="flex justify-center mt-4">
          <Button onClick={() => setShowSuccessMessage(false)} className="bg-green-600 hover:bg-green-700 text-white">
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )

  const renderEmailNotSentBanner = () => {
    if (!showEmailNotSent) return null

    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white p-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Email Not Sent</h3>
            <p className="text-sm">
              We have detected that you did not send the email. To have better assistance, please resend the email.
              Thank you!
            </p>
          </div>
          <button
            onClick={() => setShowEmailNotSent(false)}
            className="text-white hover:text-gray-200 transition-colors"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  const renderNavigation = () => (
    <nav className="flex items-center justify-between p-6 border-b border-border relative z-10">
      <div className="flex items-center space-x-8">
        <h1 className="text-2xl font-bold text-primary">INTEGRUM</h1>
        <div className="flex space-x-6">
          <Button variant="ghost" onClick={() => setCurrentView("home")} className="flex items-center space-x-2">
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Button>
          <Button variant="ghost" onClick={() => setCurrentView("faq")} className="flex items-center space-x-2">
            <HelpCircle className="w-4 h-4" />
            <span>FAQ</span>
          </Button>
          <Button variant="ghost" onClick={() => setCurrentView("contact")} className="flex items-center space-x-2">
            <Phone className="w-4 h-4" />
            <span>Contact</span>
          </Button>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        {isAuthenticated && session?.user ? (
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span className="text-sm">{session.user.email}</span>
            <Button variant="outline" size="sm" onClick={handleLogoutClick}>
              Logout
            </Button>
          </div>
        ) : (
          <Button variant="outline" onClick={handleGoogleAuth} disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Login"}
          </Button>
        )}
      </div>
    </nav>
  )

  const handleGoogleSignInContinue = () => {
    if (googleSignInType === "submit") {
      console.log("[v0] Redirecting to OAuth with /submit-ticket callback")
      window.location.href = "/api/auth/google?callbackUrl=/submit-ticket"
    } else {
      console.log("[v0] Redirecting to OAuth with default callback")
      window.location.href = "/api/auth/google"
    }
  }

  const handleNavigateToFAQ = () => {
    setCurrentView("faq")
    setTimeout(() => {
      setOpenItems((prev) => (prev.includes("email-address") ? prev : [...prev, "email-address"]))
    }, 100)
  }

  const renderHome = () => (
    <div className="min-h-screen bg-black relative">
      <SnowAnimation />
      {renderEmailNotSentBanner()}
      {renderNavigation()}
      {renderSecurityDialog()}
      {renderSuccessMessageDialog()}
      <LogoutConfirmationDialog
        isOpen={showLogoutConfirmation}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />
      <GoogleSignInModal
        isOpen={showGoogleSignIn}
        onClose={() => setShowGoogleSignIn(false)}
        onContinue={handleGoogleSignInContinue}
        type={googleSignInType}
        onNavigateToFAQ={handleNavigateToFAQ}
      />
      <GmailFlowDialog
        isOpen={showGmailFlow}
        onClose={() => setShowGmailFlow(false)}
        ticketId={currentTicketId}
        customerEmail={session?.user?.email || ""}
        gmailComposeUrl={`https://mail.google.com/mail/?view=cm&to=heyroy23415@gmail.com&su=${encodeURIComponent(`Support Request - ${currentTicketId}`)}&body=${encodeURIComponent(`Hello Integrum Support Team,\n\nI need assistance with the following issue:\n\n[Please describe your issue here]\n\nBest regards,\n${session?.user?.name || "Customer"}\n\n---\nTicket ID: ${currentTicketId}\nSubmitted: ${new Date().toLocaleString()}\nFrom: ${session?.user?.email}`)}`}
      />

      <section className="py-20 px-6 text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-Je1f9KLkJAwxxFIK6cG70qgyG818nw.png"
              alt="Integrum Logo"
              className="w-32 h-32"
            />
          </div>
          <p className="text-primary text-sm font-medium mb-4">AI-Powered Ticket Management System</p>
          <h1 className="text-5xl font-bold mb-6 text-balance">
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-pulse">
              Transform Your
            </span>{" "}
            <span className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 bg-clip-text text-transparent animate-pulse">
              Support Workflow
            </span>
          </h1>
          <p className="text-xl mb-12 text-pretty bg-gradient-to-r from-cyan-400 via-yellow-400 to-pink-400 bg-clip-text text-transparent font-medium animate-pulse">
            Submit tickets seamlessly, get AI-powered insights, and track progress with our intelligent ticket
            management platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
            <Button size="lg" onClick={handleSubmitTicket} disabled={isLoading} className="flex items-center space-x-2">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              <span>Submit a Ticket</span>
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleReviewTickets}
              disabled={isLoading}
              className="flex items-center space-x-2 bg-green-600 text-white border-green-600 hover:bg-green-700"
            >
              <FileText className="w-4 h-4" />
              <span>Review Tickets</span>
            </Button>
          </div>

          <p className="text-sm text-gray-400 mb-16">
            Not sure who to send the emails to?{" "}
            <button onClick={() => setCurrentView("faq")} className="text-blue-400 hover:text-blue-300 underline">
              Check out our FAQ
            </button>
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-orange-400 border-red-500 border-4">
              <CardContent className="p-6 text-center">
                <div className="text-4xl font-bold text-black mb-2 animate-pulse">99.9%</div>
                <div className="text-xl text-black font-medium animate-pulse">Uptime Reliability</div>
              </CardContent>
            </Card>
            <Card className="bg-yellow-300 border-blue-500 border-4">
              <CardContent className="p-6 text-center">
                <div className="text-4xl font-bold text-black mb-2 animate-pulse">&lt; 5min</div>
                <div className="text-lg text-black font-medium animate-pulse">
                  Average Solution time Replied by AI Solution
                </div>
              </CardContent>
            </Card>
            <Card className="bg-purple-600 border-pink-400 border-4">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Zap className="w-12 h-12 text-white animate-pulse" />
                </div>
                <div className="text-lg text-white font-medium animate-pulse">AI-Powered Smart Insights</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )

  const renderYourTickets = () => {
    const userTickets: JiraTicket[] = tickets
    const urlParams = new URLSearchParams(window.location.search)
    const isProcessing = urlParams.get("processing") === "true"
    const processingTicketId = urlParams.get("ticket")

    const categorizeTickets = (category: string) => {
      return userTickets.filter((ticket) => {
        const mappedCategory = mapStatusToCategory(ticket.status.name)
        return mappedCategory === category
      })
    }

    const categories = [
      { name: "In Progress", color: "bg-yellow-500" },
      { name: "Pending Reply", color: "bg-blue-500" },
      { name: "Resolved", color: "bg-green-500" },
    ]

    const getTicketCellColor = (category: string) => {
      return "bg-white"
    }

    const handleViewTicket = (ticketKey: string) => {
      window.location.href = `/jira-ticket/${ticketKey}`
    }

    const hasTickets = userTickets.length > 0

    return (
      <div className="min-h-screen bg-black relative">
        <SnowAnimation />
        {renderEmailNotSentBanner()}
        {renderNavigation()}
        {renderSecurityDialog()}
        <LogoutConfirmationDialog
          isOpen={showLogoutConfirmation}
          onConfirm={handleLogoutConfirm}
          onCancel={handleLogoutCancel}
        />

        <section className="py-12 px-6 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="bg-blue-100 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-3xl font-bold text-black">Your Ticket Page</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshTickets}
                  disabled={isLoadingTickets}
                  className="flex items-center space-x-2 bg-green-600 text-white border-green-600 hover:bg-green-700"
                >
                  {isLoadingTickets ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
                </Button>
              </div>

              {session?.user && (
                <div className="mb-6 p-3 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-600">Logged in as:</p>
                  <p className="font-medium text-black">{session.user.email}</p>
                </div>
              )}

              {ticketsError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-red-800">Error Loading Tickets</h3>
                      <p className="text-sm text-red-700">{ticketsError}. Please try refreshing the page.</p>
                    </div>
                  </div>
                </div>
              )}

              {isProcessing && processingTicketId && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center">
                      <div className="relative">
                        <div className="w-12 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Mail className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                          <Lightbulb className="w-2 h-2 text-yellow-800" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-blue-800">Email Submitted Successfully!</h3>
                      <p className="text-sm text-blue-700">
                        Ticket ID: <strong>{processingTicketId}</strong> - Auto-acknowledgement is on the way. The AI
                        proposition will be provided shortly within 5 minutes.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isLoadingTickets && tickets.length === 0 ? (
                <div className="text-center py-12">
                  <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
                  <h3 className="text-xl font-semibold text-black mb-2">Loading Your Tickets...</h3>
                  <p className="text-gray-600">Fetching your tickets from Jira</p>
                </div>
              ) : hasTickets ? (
                <div className="grid md:grid-cols-3 gap-6">
                  {categories.map((category) => {
                    const categoryTickets = categorizeTickets(category.name)
                    const displayTickets = categoryTickets.slice(0, 3)

                    return (
                      <div key={category.name} className="space-y-4">
                        <h3
                          className={`text-xl font-semibold text-black border-b border-gray-600 pb-2 px-4 py-2 rounded-t-lg ${category.color}`}
                        >
                          {category.name}
                        </h3>

                        <div
                          className={`space-y-4 ${categoryTickets.length > 3 ? "max-h-96 overflow-y-auto pr-2" : ""}`}
                        >
                          {displayTickets.map((ticket) => (
                            <Card
                              key={ticket.key}
                              className={`${getTicketCellColor(ticket.status.name)} border-gray-700`}
                            >
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm text-black line-clamp-2">{ticket.summary}</CardTitle>
                                <CardDescription className="text-xs text-gray-600">
                                  {ticket.key} • {new Date(ticket.updated).toLocaleDateString()}
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="pt-0">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewTicket(ticket.key)}
                                  className="w-full text-white bg-green-600 border-green-600 hover:bg-green-700 hover:text-white text-xs"
                                >
                                  View Ticket Info
                                </Button>
                              </CardContent>
                            </Card>
                          ))}

                          {categoryTickets.length === 0 && (
                            <Card className={`${getTicketCellColor(category.name)} border-gray-700`}>
                              <CardContent className="p-4 text-center">
                                <p className="text-black text-sm">No tickets in this category</p>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-black mb-2">No Tickets Yet</h3>
                  <p className="text-gray-600 mb-6">
                    You haven't submitted any tickets yet. Get started by submitting your first ticket!
                  </p>
                  <Button onClick={handleSubmitTicket} className="bg-blue-600 hover:bg-blue-700 text-white">
                    Submit Your First Ticket
                  </Button>
                </div>
              )}

              <Button
                onClick={() => setCurrentView("home")}
                variant="outline"
                className="mt-8 bg-green-600 text-white border-green-600 hover:bg-green-700"
              >
                Back to Home
              </Button>
            </div>
          </div>
        </section>
      </div>
    )
  }

  const renderFAQ = () => {
    const toggleItem = (itemId: string) => {
      setOpenItems((prev) => (prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]))
    }

    return (
      <div className="min-h-screen bg-black relative">
        <SnowAnimation />
        {renderEmailNotSentBanner()}
        {renderNavigation()}
        {renderSecurityDialog()}
        {renderSuccessMessageDialog()}
        <LogoutConfirmationDialog
          isOpen={showLogoutConfirmation}
          onConfirm={handleLogoutConfirm}
          onCancel={handleLogoutCancel}
        />

        <section className="py-12 px-6 relative z-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-white">Frequently Asked Questions</h2>

            <div className="space-y-4">
              <Collapsible
                open={openItems.includes("email-address")}
                onOpenChange={() => toggleItem("email-address")}
                data-faq="email-address"
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-900 hover:bg-gray-800 rounded-lg text-left transition-colors">
                  <span className="text-white font-medium">What to fill in email address "To" Under Compose?</span>
                  <ChevronDown
                    className={`w-5 h-5 text-white transition-transform ${openItems.includes("email-address") ? "rotate-180" : ""}`}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="bg-gray-800 rounded-b-lg p-4 border-t border-gray-700">
                  <div className="text-gray-300 space-y-3">
                    <p>Open Gmail Compose manually and fill in:</p>
                    <div className="bg-blue-900/50 border border-blue-700 rounded-lg p-3">
                      <p>
                        <strong>To:</strong> heyroy23415@gmail.com
                      </p>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible open={openItems.includes("submit-ticket")} onOpenChange={() => toggleItem("submit-ticket")}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-900 hover:bg-gray-800 rounded-lg text-left transition-colors">
                  <span className="text-white font-medium">How do I submit a support ticket?</span>
                  <ChevronDown
                    className={`w-5 h-5 text-white transition-transform ${openItems.includes("submit-ticket") ? "rotate-180" : ""}`}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="bg-gray-800 rounded-b-lg p-4 border-t border-gray-700">
                  <div className="text-gray-300">
                    Click the "Submit a Ticket" button on the homepage. You'll need to authenticate with Google first,
                    then your email client will open with our support email pre-filled. Simply describe your issue and
                    send.
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible
                open={openItems.includes("response-times")}
                onOpenChange={() => toggleItem("response-times")}
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-900 hover:bg-gray-800 rounded-lg text-left transition-colors">
                  <span className="text-white font-medium">What are your response times?</span>
                  <ChevronDown
                    className={`w-5 h-5 text-white transition-transform ${openItems.includes("response-times") ? "rotate-180" : ""}`}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="bg-gray-800 rounded-b-lg p-4 border-t border-gray-700">
                  <div className="text-gray-300">
                    We aim to respond to all tickets within 2-3 working days. You'll receive an auto-acknowledgement
                    immediately after submitting your ticket, and our AI system will begin analyzing your issue.
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible open={openItems.includes("ai-system")} onOpenChange={() => toggleItem("ai-system")}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-900 hover:bg-gray-800 rounded-lg text-left transition-colors">
                  <span className="text-white font-medium">How does the AI system work?</span>
                  <ChevronDown
                    className={`w-5 h-5 text-white transition-transform ${openItems.includes("ai-system") ? "rotate-180" : ""}`}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="bg-gray-800 rounded-b-lg p-4 border-t border-gray-700">
                  <div className="text-gray-300">
                    Our AI system automatically analyzes incoming tickets, categorizes them by priority and type, and
                    suggests potential solutions. This helps our support team provide faster, more accurate responses.
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible open={openItems.includes("track-status")} onOpenChange={() => toggleItem("track-status")}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-900 hover:bg-gray-800 rounded-lg text-left transition-colors">
                  <span className="text-white font-medium">Can I track my ticket status?</span>
                  <ChevronDown
                    className={`w-5 h-5 text-white transition-transform ${openItems.includes("track-status") ? "rotate-180" : ""}`}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="bg-gray-800 rounded-b-lg p-4 border-t border-gray-700">
                  <div className="text-gray-300">
                    Yes! After authenticating, use the "Review Tickets" button to see all your submitted tickets and
                    their current status (In Progress, Resolved, Awaiting Reply, etc.).
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible open={openItems.includes("ticket-info")} onOpenChange={() => toggleItem("ticket-info")}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-900 hover:bg-gray-800 rounded-lg text-left transition-colors">
                  <span className="text-white font-medium">What information should I include in my ticket?</span>
                  <ChevronDown
                    className={`w-5 h-5 text-white transition-transform ${openItems.includes("ticket-info") ? "rotate-180" : ""}`}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="bg-gray-800 rounded-b-lg p-4 border-t border-gray-700">
                  <div className="text-gray-300 space-y-3">
                    <p>To help us resolve your issue quickly, please include:</p>
                    <ul className="list-disc ml-6 space-y-1">
                      <li>A clear description of the problem</li>
                      <li>Steps to reproduce the issue</li>
                      <li>Expected vs actual behavior</li>
                      <li>Screenshots or error messages (if applicable)</li>
                      <li>Your browser and operating system</li>
                      <li>When the issue first occurred</li>
                    </ul>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            <Button
              onClick={() => setCurrentView("home")}
              variant="outline"
              className="mt-8 bg-green-600 text-white border-green-600 hover:bg-green-700"
            >
              Back to Home
            </Button>
          </div>
        </section>
      </div>
    )
  }

  const renderContact = () => (
    <div className="min-h-screen bg-black relative">
      <SnowAnimation />
      {renderEmailNotSentBanner()}
      {renderNavigation()}
      {renderSecurityDialog()}
      <LogoutConfirmationDialog
        isOpen={showLogoutConfirmation}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />

      <section className="py-12 px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-white">Contact Us</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Get in Touch</CardTitle>
                <CardDescription className="text-gray-400">
                  We're here to help with any questions or issues you may have.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-blue-400" />
                  <span className="text-gray-300">heyroy23415@gmail.com</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-blue-400" />
                  <span className="text-gray-300">Available via email support</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Business Hours</CardTitle>
                <CardDescription className="text-gray-400">
                  Our support team is available during these hours.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-300">Monday - Friday</span>
                  <span className="text-gray-300">9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Saturday</span>
                  <span className="text-gray-300">10:00 AM - 4:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Sunday</span>
                  <span className="text-gray-300">Closed</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Button
            onClick={() => setCurrentView("home")}
            variant="outline"
            className="mt-8 bg-green-600 text-white border-green-600 hover:bg-green-700"
          >
            Back to Home
          </Button>
        </div>
      </section>
    </div>
  )

  const handleLogoutClick = () => {
    setShowLogoutConfirmation(true)
  }

  const handleLogoutConfirm = () => {
    setShowLogoutConfirmation(false)
    toast({
      title: "Logged Out Successfully",
      description: "You have been logging out of Integrum Apps, and we hope to see you again!",
      duration: 3000,
    })
    setTimeout(() => {
      signOut()
    }, 500)
  }

  const handleLogoutCancel = () => {
    setShowLogoutConfirmation(false)
  }

  switch (currentView) {
    case "yourTickets":
      return renderYourTickets()
    case "faq":
      return renderFAQ()
    case "contact":
      return renderContact()
    default:
      return renderHome()
  }
}
