"use client"

import { useState, useEffect } from "react"
import { useSession } from "@/lib/use-session"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Loader2, Mail, AlertCircle } from "@/components/icons"
import {
  Zap,
  Home,
  FileText,
  HelpCircle,
  Phone,
  Shield,
  Key,
  Lightbulb,
  ChevronDown,
  Clock,
  TrendingUp,
} from "lucide-react"
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
      <div className="fixed inset-0 pointer-events-none z-0">{snowflakes}</div>
    </>
  )
}

const AIBackgroundAnimation = () => {
  return (
    <>
      <style jsx>{`
        @keyframes float1 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -30px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        
        @keyframes float2 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(-40px, 30px) scale(0.9);
          }
          66% {
            transform: translate(30px, -20px) scale(1.1);
          }
        }
        
        @keyframes float3 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(20px, 40px) scale(1.05);
          }
          66% {
            transform: translate(-30px, -30px) scale(0.95);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 0.15;
          }
          50% {
            opacity: 0.25;
          }
        }

        @keyframes grid-move {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(40px);
          }
        }
      `}</style>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Orb 1 - Deep Blue */}
        <div
          className="absolute top-20 left-10 w-[500px] h-[500px] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(30, 58, 138, 0.2) 0%, rgba(59, 130, 246, 0.15) 50%, transparent 70%)",
            animation: "float1 25s ease-in-out infinite, pulse 8s ease-in-out infinite",
          }}
        />

        {/* Gradient Orb 2 - Cyan/Tech Blue */}
        <div
          className="absolute top-40 right-20 w-[600px] h-[600px] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(6, 182, 212, 0.18) 0%, rgba(14, 165, 233, 0.12) 50%, transparent 70%)",
            animation: "float2 30s ease-in-out infinite, pulse 10s ease-in-out infinite 2s",
          }}
        />

        {/* Gradient Orb 3 - Slate Blue */}
        <div
          className="absolute bottom-20 left-1/3 w-[550px] h-[550px] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(51, 65, 85, 0.15) 0%, rgba(71, 85, 105, 0.1) 50%, transparent 70%)",
            animation: "float3 28s ease-in-out infinite, pulse 9s ease-in-out infinite 4s",
          }}
        />

        {/* Grid pattern overlay for tech aesthetic */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(30, 58, 138, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(30, 58, 138, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
            animation: "grid-move 20s linear infinite",
          }}
        />
      </div>
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

  const [tickets, setTickets] = useState<JiraTicket[]>([])
  const [isLoadingTickets, setIsLoadingTickets] = useState(false)
  const [ticketsError, setTicketsError] = useState<string | null>(null)
  const [ticketLimit, setTicketLimit] = useState(100)

  const userEmail = session?.user?.email || ""

  const isMasterAccount = userEmail === process.env.NEXT_PUBLIC_MASTER_EMAIL || userEmail === "heyroy23415@gmail.com"

  useEffect(() => {
    const fetchTickets = async () => {
      if (!userEmail) {
        console.log("[v0] No user email, skipping ticket fetch")
        setTickets([])
        return
      }

      setIsLoadingTickets(true)
      setTicketsError(null)

      try {
        console.log("[v0] Fetching tickets for user:", userEmail, "with limit:", ticketLimit)
        const response = await fetch(`/api/jira/tickets?email=${encodeURIComponent(userEmail)}&limit=${ticketLimit}`)

        console.log("[v0] Jira API response status:", response.status)

        if (!response.ok) {
          const errorData = await response.json()
          console.error("[v0] Jira API error response:", errorData)
          throw new Error(errorData.details || `Failed to fetch tickets: ${response.statusText}`)
        }

        const data = await response.json()
        console.log("[v0] Fetched tickets:", data.tickets?.length || 0)

        if (data.tickets && data.tickets.length > 0) {
          console.log("[v0] First ticket sample:", {
            key: data.tickets[0].key,
            summary: data.tickets[0].summary,
            status: data.tickets[0].status.name,
          })
        }

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
  }, [userEmail, ticketLimit])

  const refreshTickets = async () => {
    if (!userEmail) return

    setIsLoadingTickets(true)
    setTicketsError(null)

    try {
      const response = await fetch(`/api/jira/tickets?email=${encodeURIComponent(userEmail)}&limit=${ticketLimit}`)

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
      return "In Progress"
    }

    const statusLower = status.toLowerCase()

    if (statusLower.includes("progress") || statusLower.includes("development") || statusLower.includes("review")) {
      return "In Progress"
    }

    if (statusLower.includes("done") || statusLower.includes("resolved") || statusLower.includes("closed")) {
      return "Resolved"
    }

    if (statusLower.includes("waiting") || statusLower.includes("pending") || statusLower.includes("feedback")) {
      return "Pending Reply"
    }

    return "In Progress"
  }

  const handleGoogleAuth = () => {
    window.location.href = "/api/auth/google"
  }

  const handleAccountSelect = (account: any) => {
    if (account.signedOut) {
      const gmailUrl = userEmail
        ? `https://mail.google.com/mail/u/${userEmail}/?view=cm&to=heyroy23415@gmail.com`
        : `https://mail.google.com/mail/?view=cm&to=heyroy23415@gmail.com`
      window.open(gmailUrl, "_blank")
      return
    }

    proceedWithAuthentication(account)
  }

  const proceedWithAuthentication = (account: any) => {
    setSelectedAccount(account)

    if (googleSignInType === "submit") {
      const gmailUrl = userEmail
        ? `https://mail.google.com/mail/u/${userEmail}/?view=cm&to=heyroy23415@gmail.com&authuser=${encodeURIComponent(account.email)}`
        : `https://mail.google.com/mail/?view=cm&to=heyroy23415@gmail.com&authuser=${encodeURIComponent(account.email)}`
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
      const gmailUrl = userEmail
        ? `https://mail.google.com/mail/u/${userEmail}/?view=cm&to=heyroy23415@gmail.com`
        : `https://mail.google.com/mail/?view=cm&to=heyroy23415@gmail.com`

      console.log("[v0] Opening Gmail URL:", gmailUrl)
      window.open(gmailUrl, "_blank")

      console.log("[v0] Redirecting main window to home page")
      window.location.href = "/"
      return
    }

    if (view === "yourTickets") {
      if (processing === "true" && ticket) {
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
          <p className="text-gray-600 font-medium">
            Within 5-10 minutes after receiving your auto-acknowledgement, don't forget to click on refresh to see the
            updated ticket information.
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

  const renderNavigation = () => (
    <nav className="flex items-center justify-between p-6 border-b border-gray-200 bg-white/80 backdrop-blur-sm relative z-10 shadow-sm">
      <div className="flex items-center space-x-8">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
          INTEGRUM
        </h1>
        <div className="flex space-x-6">
          <Button
            variant="ghost"
            onClick={() => setCurrentView("home")}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => setCurrentView("faq")}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <HelpCircle className="w-4 h-4" />
            <span>FAQ</span>
          </Button>
          <Button
            variant="ghost"
            onClick={() => setCurrentView("contact")}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <Phone className="w-4 h-4" />
            <span>Contact</span>
          </Button>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        {isAuthenticated && session?.user ? (
          <div className="flex items-center space-x-4">
            <span className="text-sm text-foreground/70 hidden md:inline">{session.user.email}</span>
            <Button
              variant="ghost"
              onClick={handleLogoutClick}
              className="text-foreground/80 hover:text-primary hover:bg-secondary/50 font-medium px-4 transition-all duration-200 relative group"
            >
              Logout
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="text-foreground/80 hover:text-primary hover:bg-secondary/50 font-medium px-4 transition-all duration-200 relative group"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Login"}
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
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
    <div className="min-h-screen bg-background">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center space-x-12">
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            INTEGRUM
          </h1>
          <div className="hidden md:flex space-x-1">
            <Button
              variant="ghost"
              onClick={() => setCurrentView("home")}
              className="text-foreground/80 hover:text-primary hover:bg-secondary/50 font-medium px-4 transition-all duration-200"
            >
              Home
            </Button>
            <Button
              variant="ghost"
              onClick={() => setCurrentView("faq")}
              className="text-foreground/80 hover:text-primary hover:bg-secondary/50 font-medium px-4 transition-all duration-200 relative group"
            >
              FAQ
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => setCurrentView("contact")}
              className="text-foreground/80 hover:text-primary hover:bg-secondary/50 font-medium px-4 transition-all duration-200 relative group"
            >
              Contact
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
            </Button>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {isAuthenticated && session?.user ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-foreground/70 hidden md:inline">{session.user.email}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogoutClick}
                className="border-border text-foreground hover:bg-secondary/80 bg-transparent transition-all duration-200"
              >
                Logout
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="text-foreground/80 hover:text-primary hover:bg-secondary/50 font-medium px-4 transition-all duration-200 relative group"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Login"}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
            </Button>
          )}
        </div>
      </nav>

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
        gmailComposeUrl={
          userEmail
            ? `https://mail.google.com/mail/u/${userEmail}/?view=cm&to=heyroy23415@gmail.com&su=${encodeURIComponent(`Support Request - ${currentTicketId}`)}&body=${encodeURIComponent(`Hello Integrum Support Team,\n\nI need assistance with the following issue:\n\n[Please describe your issue here]\n\nBest regards,\n${session?.user?.name || "Customer"}\n\n---\nTicket ID: ${currentTicketId}\nSubmitted: ${new Date().toLocaleString()}\nFrom: ${session?.user?.email}`)}`
            : `https://mail.google.com/mail/?view=cm&to=heyroy23415@gmail.com&su=${encodeURIComponent(`Support Request - ${currentTicketId}`)}&body=${encodeURIComponent(`Hello Integrum Support Team,\n\nI need assistance with the following issue:\n\n[Please describe your issue here]\n\nBest regards,\n${session?.user?.name || "Customer"}\n\n---\nTicket ID: ${currentTicketId}\nSubmitted: ${new Date().toLocaleString()}\nFrom: ${session?.user?.email}`)}`
        }
      />

      <section className="relative overflow-hidden bg-gradient-to-b from-background via-secondary/10 to-background">
        <AIBackgroundAnimation />

        <div className="relative max-w-7xl mx-auto px-8 py-28 md:py-36">
          <div className="text-center max-w-5xl mx-auto">
            <div className="inline-flex items-center space-x-2 px-5 py-2.5 bg-primary/15 border border-primary/30 rounded-full mb-8 backdrop-blur-sm">
              <span className="text-sm font-semibold text-primary tracking-wide uppercase">AI-Powered Support</span>
            </div>

            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-8 tracking-tight text-balance">
              <span className="text-foreground">Intelligent Support</span>
              <br />
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Built for Scale
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-foreground/70 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
              Intelligent ticket management powered by AI. Submit, track, and resolve issues with unprecedented speed
              and intelligence.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button
                size="lg"
                onClick={handleSubmitTicket}
                disabled={isLoading}
                className="bg-transparent border-2 border-primary text-white hover:bg-primary hover:text-white hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] px-10 py-7 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl cursor-pointer hover:scale-105"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Mail className="w-5 h-5 mr-2" />}
                Submit Ticket
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleReviewTickets}
                disabled={isLoading}
                className="bg-transparent border-2 border-primary text-white hover:bg-primary hover:text-white hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] px-10 py-7 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl cursor-pointer hover:scale-105"
              >
                <FileText className="w-5 h-5 mr-2" />
                View Tickets
              </Button>
            </div>

            <p className="text-sm text-foreground/60">
              Need help?{" "}
              <button
                onClick={() => setCurrentView("faq")}
                className="text-primary hover:text-primary/80 font-semibold underline underline-offset-2 transition-colors"
              >
                View more in FAQ
              </button>
            </p>
          </div>
        </div>
      </section>

      <section className="py-24 px-8 bg-gradient-to-b from-background to-secondary/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">Platform Metrics</h2>
            <p className="text-xl text-foreground/70 max-w-2xl mx-auto">Proven performance and reliability at scale</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Statistics cards */}
            <div className="text-center p-10 rounded-2xl border-2 border-border hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/20 hover:scale-[1.03] transition-all duration-300 cursor-pointer">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl mb-6 shadow-lg">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div className="text-6xl font-bold text-foreground mb-3 tracking-tight">99.9%</div>
              <div className="text-foreground/90 font-medium text-lg">System Uptime</div>
              <div className="text-sm text-foreground/60 mt-2">Enterprise reliability</div>
            </div>

            <div className="text-center p-10 rounded-2xl border-2 border-border hover:border-accent/50 hover:shadow-2xl hover:shadow-accent/20 hover:scale-[1.03] transition-all duration-300 cursor-pointer">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-xl mb-6 shadow-lg">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <div className="text-6xl font-bold text-foreground mb-3 tracking-tight">&lt;5min</div>
              <div className="text-foreground/90 font-medium text-lg">AI Response Time</div>
              <div className="text-sm text-foreground/60 mt-2">Average processing speed</div>
            </div>

            <div className="text-center p-10 rounded-2xl border-2 border-border hover:border-accent/50 hover:shadow-2xl hover:shadow-accent/20 hover:scale-[1.03] transition-all duration-300 cursor-pointer">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-accent to-primary rounded-xl mb-6 shadow-lg">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-foreground mb-3 tracking-tight">AI-Driven</div>
              <div className="text-foreground/90 font-medium text-lg">Smart Analysis</div>
              <div className="text-sm text-foreground/60 mt-2">Intelligent insights & automation</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-8 bg-gradient-to-b from-background to-secondary/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">AI-Driven Features</h2>
            <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
              Intelligent automation for modern support teams
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Features visible to all users */}
            <div className="p-8 rounded-2xl border-2 border-border hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-300 group cursor-pointer">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Mail className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Email Integration</h3>
              <p className="text-foreground/75 leading-relaxed">
                Seamless Gmail integration with automatic ticket creation and tracking.
              </p>
            </div>

            <div className="p-8 rounded-2xl border-2 border-border hover:border-primary/50 hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 group cursor-pointer">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Real-time Tracking</h3>
              <p className="text-foreground/75 leading-relaxed">
                Monitor your ticket status and progress with live updates.
              </p>
            </div>

            <div className="p-8 rounded-2xl border-2 border-border hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/20 transition-all duration-300 group cursor-pointer">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Instant Responses</h3>
              <p className="text-foreground/75 leading-relaxed">
                Auto-acknowledgement and AI-powered initial responses within period of minutes.
              </p>
            </div>

            {/* Additional features for master account */}
            {isMasterAccount && (
              <>
                <div className="p-8 rounded-2xl border-2 border-border hover:border-primary/50 hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 group cursor-pointer">
                  <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Enterprise Security</h3>
                  <p className="text-foreground/75 leading-relaxed">
                    Bank-level encryption and compliance with industry standards.
                  </p>
                </div>

                <div className="p-8 rounded-2xl border-2 border-border hover:border-accent/50 hover:shadow-xl hover:shadow-accent/20 transition-all duration-300 group cursor-pointer">
                  <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Lightbulb className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">AI Insights</h3>
                  <p className="text-foreground/75 leading-relaxed">
                    Automated categorization and intelligent routing for faster resolution.
                  </p>
                </div>

                <div className="p-8 rounded-2xl border-2 border-border hover:border-accent/50 hover:shadow-xl hover:shadow-accent/20 transition-all duration-300 group cursor-pointer">
                  <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">Full Admin Access</h3>
                  <p className="text-foreground/75 leading-relaxed">
                    Complete control over all tickets, users, and system settings.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <footer className="py-12 px-8 bg-card/30 border-t border-border">
        <div className="max-w-7xl mx-auto text-center">
          <span className="text-xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            INTEGRUM
          </span>
          <p className="text-foreground/70 text-sm mt-2">Enterprise AI-Powered Support Platform</p>
          <p className="text-foreground/50 text-xs mt-2">© 2025 Integrum. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )

  const renderYourTickets = () => {
    const userTickets: JiraTicket[] = tickets
    const urlParams = new URLSearchParams(window.location.search)
    const isProcessing = urlParams.get("processing") === "true"
    const processingTicketId = urlParams.get("ticket")

    console.log("[v0] Total tickets in state:", userTickets.length)

    if (userTickets.length > 0) {
      const statusCounts: Record<string, number> = {}
      userTickets.forEach((ticket) => {
        const status = ticket.status.name
        statusCounts[status] = (statusCounts[status] || 0) + 1
      })
      console.log("[v0] Status distribution:", statusCounts)

      console.log(
        "[v0] Sample tickets (first 5):",
        userTickets.slice(0, 5).map((t) => ({
          key: t.key,
          summary: t.summary.substring(0, 50),
          status: t.status.name,
          mapped: mapStatusToCategory(t.status.name),
        })),
      )
    }

    const categorizeTickets = (category: string) => {
      const filtered = userTickets.filter((ticket) => {
        const mappedCategory = mapStatusToCategory(ticket.status.name)
        return mappedCategory === category
      })
      console.log(`[v0] Category "${category}" has ${filtered.length} tickets`)
      return filtered
    }

    const categories = [
      { name: "In Progress", color: "bg-yellow-500" },
      { name: "Pending Reply", color: "bg-blue-500" },
      { name: "Resolved", color: "bg-green-500" },
    ]

    categories.forEach((cat) => {
      const count = categorizeTickets(cat.name).length
      console.log(`[v0] "${cat.name}" category: ${count} tickets`)
    })

    const hasTickets = userTickets.length > 0

    return (
      <div className="min-h-screen bg-background">
        {/* Modern Navigation matching home page */}
        <nav className="flex items-center justify-between px-8 py-5 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center space-x-12">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              INTEGRUM
            </h1>
            <div className="hidden md:flex space-x-1">
              <Button
                variant="ghost"
                onClick={() => setCurrentView("home")}
                className="text-foreground/80 hover:text-primary hover:bg-secondary/50 font-medium px-4 transition-all duration-200"
              >
                Home
              </Button>
              <Button
                variant="ghost"
                onClick={() => setCurrentView("faq")}
                className="text-foreground/80 hover:text-primary hover:bg-secondary/50 font-medium px-4 transition-all duration-200 relative group"
              >
                FAQ
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => setCurrentView("contact")}
                className="text-foreground/80 hover:text-primary hover:bg-secondary/50 font-medium px-4 transition-all duration-200 relative group"
              >
                Contact
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {isAuthenticated && session?.user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-foreground/70 hidden md:inline">{session.user.email}</span>
                <Button
                  variant="ghost"
                  onClick={handleLogoutClick}
                  className="text-foreground/80 hover:text-primary hover:bg-secondary/50 font-medium px-4 transition-all duration-200 relative group"
                >
                  Logout
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="text-foreground/80 hover:text-primary hover:bg-secondary/50 font-medium px-4 transition-all duration-200 relative group"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Login"}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
              </Button>
            )}
          </div>
        </nav>

        {renderSecurityDialog()}
        <LogoutConfirmationDialog
          isOpen={showLogoutConfirmation}
          onConfirm={handleLogoutConfirm}
          onCancel={handleLogoutCancel}
        />

        {/* Background animation matching home page */}
        <div className="relative overflow-hidden bg-gradient-to-b from-background via-secondary/10 to-background">
          <AIBackgroundAnimation />

          <section className="relative py-16 px-8">
            <div className="max-w-7xl mx-auto">
              <div className="bg-card/50 border-2 border-border backdrop-blur-sm rounded-2xl p-8 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-4xl font-bold text-foreground">Your Ticket Page</h2>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <label htmlFor="ticket-limit" className="text-sm font-medium text-foreground/80">
                        Show:
                      </label>
                      <select
                        id="ticket-limit"
                        value={ticketLimit}
                        onChange={(e) => setTicketLimit(Number(e.target.value))}
                        className="px-4 py-2 border-2 border-primary rounded-lg text-sm bg-secondary/80 text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary hover:bg-secondary transition-all duration-200 cursor-pointer"
                      >
                        <option value={50} className="bg-secondary text-foreground">
                          50 tickets
                        </option>
                        <option value={100} className="bg-secondary text-foreground">
                          100 tickets
                        </option>
                        <option value={200} className="bg-secondary text-foreground">
                          200 tickets
                        </option>
                        <option value={500} className="bg-secondary text-foreground">
                          500 tickets
                        </option>
                        {isMasterAccount && (
                          <option value={1000} className="bg-secondary text-foreground">
                            1000 tickets
                          </option>
                        )}
                      </select>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refreshTickets}
                      disabled={isLoadingTickets}
                      className="flex items-center space-x-2 bg-transparent border-2 border-primary text-white hover:bg-primary hover:text-white hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all duration-300 hover:scale-105"
                    >
                      {isLoadingTickets ? <Loader2 className="w-4 h-4 animate-spin" /> : "Refresh"}
                    </Button>
                  </div>
                </div>

                {session?.user && (
                  <div className="mb-6 p-4 bg-secondary/30 border-2 border-border rounded-xl">
                    <p className="text-sm text-foreground/70">Logged in as:</p>
                    <p className="font-medium text-foreground">{session.user.email}</p>
                  </div>
                )}

                {ticketsError && (
                  <div className="mb-6 p-4 bg-red-500/10 border-2 border-red-500/50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <AlertCircle className="w-6 h-6 text-red-400" />
                      <div>
                        <h3 className="text-lg font-semibold text-red-400">Error Loading Tickets</h3>
                        <p className="text-sm text-red-400/80">{ticketsError}. Please try refreshing the page.</p>
                      </div>
                    </div>
                  </div>
                )}

                {isProcessing && processingTicketId && (
                  <div className="mb-6 p-4 bg-primary/10 border-2 border-primary/50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center">
                        <div className="relative">
                          <div className="w-12 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                            <Mail className="w-6 h-6 text-primary" />
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                            <Lightbulb className="w-2 h-2 text-yellow-800" />
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-primary">Email Submitted Successfully!</h3>
                        <p className="text-sm text-foreground/80">
                          Ticket ID: <strong>{processingTicketId}</strong> - Auto-acknowledgement is on the way. The AI
                          proposition will be provided shortly within 5 minutes.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {isLoadingTickets && tickets.length === 0 ? (
                  <div className="text-center py-16">
                    <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">Loading Your Tickets...</h3>
                    <p className="text-foreground/70">Fetching your tickets from Jira</p>
                  </div>
                ) : hasTickets ? (
                  <div className="grid md:grid-cols-3 gap-6">
                    {categories.map((category) => {
                      const categoryTickets = categorizeTickets(category.name)

                      return (
                        <div key={category.name} className="space-y-4">
                          <div
                            className={`flex items-center justify-between text-xl font-semibold text-white border-b-2 border-border pb-2 px-4 py-3 rounded-t-xl ${category.color} shadow-lg`}
                          >
                            {category.name === "Resolved" ? (
                              <div className="flex items-center gap-2">
                                <svg
                                  width="20"
                                  height="20"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <circle cx="12" cy="12" r="10" fill="#22C55E" />
                                  <path
                                    d="M7 12L10.5 15.5L17 9"
                                    stroke="#FFFFFF"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <h3>{category.name}</h3>
                              </div>
                            ) : (
                              <h3>{category.name}</h3>
                            )}
                          </div>

                          <div className="max-h-[600px] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                            {categoryTickets.length > 0 ? (
                              categoryTickets.map((ticket) => (
                                <Card
                                  key={ticket.key}
                                  className="bg-card/80 border-2 border-border hover:border-primary/50 hover:shadow-xl hover:shadow-primary/20 transition-all duration-300"
                                >
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-sm text-foreground line-clamp-2">
                                      {ticket.summary}
                                    </CardTitle>
                                    <CardDescription className="text-xs text-foreground/60">
                                      {ticket.key} • {new Date(ticket.updated).toLocaleDateString()}
                                    </CardDescription>
                                  </CardHeader>
                                  <CardContent className="pt-0">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => (window.location.href = `/jira-ticket/${ticket.key}`)}
                                      className="w-full bg-transparent border-2 border-primary text-white hover:bg-primary hover:text-white hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] text-xs transition-all duration-300 hover:scale-105"
                                    >
                                      View Ticket Info
                                    </Button>
                                  </CardContent>
                                </Card>
                              ))
                            ) : (
                              <Card className="bg-card/50 border-2 border-border">
                                <CardContent className="p-4 text-center">
                                  <p className="text-foreground/60 text-sm">No tickets in this category</p>
                                </CardContent>
                              </Card>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <FileText className="w-16 h-16 text-foreground/40 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">No Tickets Yet</h3>
                    <p className="text-foreground/70 mb-6">
                      You haven't submitted any tickets yet. Get started by submitting your first ticket!
                    </p>
                    <Button
                      onClick={handleSubmitTicket}
                      className="bg-transparent border-2 border-primary text-white hover:bg-primary hover:text-white hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all duration-300 hover:scale-105"
                    >
                      Submit Your First Ticket
                    </Button>
                  </div>
                )}

                <Button
                  onClick={() => setCurrentView("home")}
                  variant="outline"
                  className="mt-8 bg-transparent border-2 border-primary text-white hover:bg-primary hover:text-white hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all duration-300 hover:scale-105"
                >
                  Back to Home
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    )
  }

  const renderFAQ = () => {
    const toggleItem = (itemId: string) => {
      setOpenItems((prev) => (prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]))
    }

    return (
      <div className="min-h-screen bg-background">
        {/* Modern Navigation matching home page */}
        <nav className="flex items-center justify-between px-8 py-5 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center space-x-12">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              INTEGRUM
            </h1>
            <div className="hidden md:flex space-x-1">
              <Button
                variant="ghost"
                onClick={() => setCurrentView("home")}
                className="text-foreground/80 hover:text-primary hover:bg-secondary/50 font-medium px-4 transition-all duration-200"
              >
                Home
              </Button>
              <Button
                variant="ghost"
                onClick={() => setCurrentView("faq")}
                className="text-foreground/80 hover:text-primary hover:bg-secondary/50 font-medium px-4 transition-all duration-200 relative group"
              >
                FAQ
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
              </Button>
              <Button
                variant="ghost"
                onClick={() => setCurrentView("contact")}
                className="text-foreground/80 hover:text-primary hover:bg-secondary/50 font-medium px-4 transition-all duration-200 relative group"
              >
                Contact
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {isAuthenticated && session?.user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-foreground/70 hidden md:inline">{session.user.email}</span>
                <Button
                  variant="ghost"
                  onClick={handleLogoutClick}
                  className="text-foreground/80 hover:text-primary hover:bg-secondary/50 font-medium px-4 transition-all duration-200 relative group"
                >
                  Logout
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="text-foreground/80 hover:text-primary hover:bg-secondary/50 font-medium px-4 transition-all duration-200 relative group"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Login"}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
              </Button>
            )}
          </div>
        </nav>

        {renderSecurityDialog()}
        {renderSuccessMessageDialog()}
        <LogoutConfirmationDialog
          isOpen={showLogoutConfirmation}
          onConfirm={handleLogoutConfirm}
          onCancel={handleLogoutCancel}
        />

        {/* Background animation matching home page */}
        <div className="relative overflow-hidden bg-gradient-to-b from-background via-secondary/10 to-background">
          <AIBackgroundAnimation />

          <section className="relative py-16 px-8">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-4xl font-bold mb-10 text-foreground">Frequently Asked Questions</h2>

              <div className="space-y-4">
                <Collapsible
                  open={openItems.includes("email-address")}
                  onOpenChange={() => toggleItem("email-address")}
                  data-faq="email-address"
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-5 bg-card/80 border-2 border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 rounded-xl text-left transition-all duration-300">
                    <span className="text-foreground font-semibold">
                      What to fill in email address "To" Under Compose?
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-foreground/60 transition-transform ${openItems.includes("email-address") ? "rotate-180" : ""}`}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="bg-card/60 border-2 border-border border-t-0 rounded-b-xl p-5">
                    <div className="text-foreground/80 space-y-3">
                      <p>Open Gmail Compose manually and fill in:</p>
                      <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-4">
                        <p>
                          <strong>To:</strong> heyroy23415@gmail.com
                        </p>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible
                  open={openItems.includes("submit-ticket")}
                  onOpenChange={() => toggleItem("submit-ticket")}
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-5 bg-card/80 border-2 border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 rounded-xl text-left transition-all duration-300">
                    <span className="text-foreground font-semibold">How do I submit a support ticket?</span>
                    <ChevronDown
                      className={`w-5 h-5 text-foreground/60 transition-transform ${openItems.includes("submit-ticket") ? "rotate-180" : ""}`}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="bg-card/60 border-2 border-border border-t-0 rounded-b-xl p-5">
                    <div className="text-foreground/80">
                      Click the "Submit Ticket" button on the homepage. You'll need to authenticate with Google first,
                      then your email client will open with our support email pre-filled. Simply describe your issue and
                      send.
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible
                  open={openItems.includes("response-times")}
                  onOpenChange={() => toggleItem("response-times")}
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-5 bg-card/80 border-2 border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 rounded-xl text-left transition-all duration-300">
                    <span className="text-foreground font-semibold">What are your response times?</span>
                    <ChevronDown
                      className={`w-5 h-5 text-foreground/60 transition-transform ${openItems.includes("response-times") ? "rotate-180" : ""}`}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="bg-card/60 border-2 border-border border-t-0 rounded-b-xl p-5">
                    <div className="text-foreground/80">
                      We aim to respond to all tickets within 2-3 working days. You'll receive an auto-acknowledgement
                      immediately after submitting your ticket, and our AI system will begin analyzing your issue.
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible open={openItems.includes("ai-system")} onOpenChange={() => toggleItem("ai-system")}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-5 bg-card/80 border-2 border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 rounded-xl text-left transition-all duration-300">
                    <span className="text-foreground font-semibold">How does the AI system work?</span>
                    <ChevronDown
                      className={`w-5 h-5 text-foreground/60 transition-transform ${openItems.includes("ai-system") ? "rotate-180" : ""}`}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="bg-card/60 border-2 border-border border-t-0 rounded-b-xl p-5">
                    <div className="text-foreground/80">
                      Our AI system automatically analyzes incoming tickets, categorizes them by priority and type, and
                      suggests potential solutions. This helps our support team provide faster, more accurate responses.
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible open={openItems.includes("track-status")} onOpenChange={() => toggleItem("track-status")}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-5 bg-card/80 border-2 border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 rounded-xl text-left transition-all duration-300">
                    <span className="text-foreground font-semibold">Can I track my ticket status?</span>
                    <ChevronDown
                      className={`w-5 h-5 text-foreground/60 transition-transform ${openItems.includes("track-status") ? "rotate-180" : ""}`}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="bg-card/60 border-2 border-border border-t-0 rounded-b-xl p-5">
                    <div className="text-foreground/80">
                      Yes! After authenticating, use the "Review Tickets" button to see all your submitted tickets and
                      their current status (In Progress, Resolved, Awaiting Reply).
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible open={openItems.includes("ticket-info")} onOpenChange={() => toggleItem("ticket-info")}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-5 bg-card/80 border-2 border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 rounded-xl text-left transition-all duration-300">
                    <span className="text-foreground font-semibold">
                      What information should I include in my ticket?
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-foreground/60 transition-transform ${openItems.includes("ticket-info") ? "rotate-180" : ""}`}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="bg-card/60 border-2 border-border border-t-0 rounded-b-xl p-5">
                    <div className="text-foreground/80 space-y-3">
                      <p>To help us resolve your issue quickly, please include:</p>
                      <ul className="list-disc ml-6 space-y-1">
                        <li>A clear description of the problem</li>
                        <li>Steps to reproduce the issue</li>
                        <li>Expected vs actual behavior</li>
                        <li>Screenshots or error messages (mandatory)</li>
                        <li>Your browser and operating system</li>
                        <li>When the issue first occurred</li>
                      </ul>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible open={openItems.includes("closed-tabs")} onOpenChange={() => toggleItem("closed-tabs")}>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-5 bg-card/80 border-2 border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 rounded-xl text-left transition-all duration-300">
                    <span className="text-foreground font-semibold">
                      Accidentally closed the tab during ticket processing?
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-foreground/60 transition-transform ${openItems.includes("closed-tabs") ? "rotate-180" : ""}`}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="bg-card/60 border-2 border-border border-t-0 rounded-b-xl p-5">
                    <div className="text-foreground/80">
                      <p>
                        Don't worry! If you accidentally close the tab while your ticket is being processed: Look for
                        the error icon on right side of "What's happening?" to navigate back to "Home" page.
                      </p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              <Button
                onClick={() => setCurrentView("home")}
                variant="outline"
                className="mt-10 bg-transparent border-2 border-primary text-white hover:bg-primary hover:text-white hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all duration-300 hover:scale-105"
              >
                Back to Home
              </Button>
            </div>
          </section>
        </div>
      </div>
    )
  }

  const renderContact = () => (
    <div className="min-h-screen bg-background">
      {/* Modern Navigation matching home page */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-border bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center space-x-12">
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            INTEGRUM
          </h1>
          <div className="hidden md:flex space-x-1">
            <Button
              variant="ghost"
              onClick={() => setCurrentView("home")}
              className="text-foreground/80 hover:text-primary hover:bg-secondary/50 font-medium px-4 transition-all duration-200"
            >
              Home
            </Button>
            <Button
              variant="ghost"
              onClick={() => setCurrentView("faq")}
              className="text-foreground/80 hover:text-primary hover:bg-secondary/50 font-medium px-4 transition-all duration-200 relative group"
            >
              FAQ
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => setCurrentView("contact")}
              className="text-foreground/80 hover:text-primary hover:bg-secondary/50 font-medium px-4 transition-all duration-200 relative group"
            >
              Contact
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
            </Button>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {isAuthenticated && session?.user ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-foreground/70 hidden md:inline">{session.user.email}</span>
              <Button
                variant="ghost"
                onClick={handleLogoutClick}
                className="text-foreground/80 hover:text-primary hover:bg-secondary/50 font-medium px-4 transition-all duration-200 relative group"
              >
                Logout
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              onClick={handleGoogleAuth}
              disabled={isLoading}
              className="text-foreground/80 hover:text-primary hover:bg-secondary/50 font-medium px-4 transition-all duration-200 relative group"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Login"}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
            </Button>
          )}
        </div>
      </nav>

      {renderSecurityDialog()}
      <LogoutConfirmationDialog
        isOpen={showLogoutConfirmation}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />

      {/* Background animation matching home page */}
      <div className="relative overflow-hidden bg-gradient-to-b from-background via-secondary/10 to-background">
        <AIBackgroundAnimation />

        <section className="relative py-16 px-8">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-4xl font-bold mb-10 text-foreground">Contact Us</h2>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="bg-card/80 border-2 border-border hover:border-primary/50 hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-foreground text-xl">Get in Touch</CardTitle>
                  <CardDescription className="text-foreground/70">
                    We're here to help with any questions or issues you may have.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-foreground/90">heyroy23415@gmail.com</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-foreground/90">+65 12345678</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/80 border-2 border-border hover:border-accent/50 hover:shadow-xl hover:shadow-accent/20 transition-all duration-300 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-foreground text-xl">Business Hours</CardTitle>
                  <CardDescription className="text-foreground/70">
                    Our support team is available during these hours.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between p-2 rounded-lg hover:bg-secondary/30 transition-colors">
                    <span className="text-foreground/90 font-medium">Monday - Friday</span>
                    <span className="text-foreground/80">9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-secondary/30 transition-colors">
                    <span className="text-foreground/90 font-medium">Saturday</span>
                    <span className="text-foreground/80">10:00 AM - 4:00 PM</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg hover:bg-secondary/30 transition-colors">
                    <span className="text-foreground/90 font-medium">Sunday & Public holiday</span>
                    <span className="text-foreground/80">Closed</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Button
              onClick={() => setCurrentView("home")}
              variant="outline"
              className="mt-10 bg-transparent border-2 border-primary text-white hover:bg-primary hover:text-white hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all duration-300 hover:scale-105"
            >
              Back to Home
            </Button>
          </div>
        </section>
      </div>
    </div>
  )

  const handleLogoutClick = () => {
    setShowLogoutConfirmation(true)
  }

  const handleLogoutConfirm = () => {
    setShowLogoutConfirmation(false)
    setCurrentView("home")
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
