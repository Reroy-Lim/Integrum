"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "@/lib/use-session"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ArrowLeft, Calendar, User, AlertCircle, Mail, Download, RefreshCw } from "@/components/icons"
import { Badge } from "@/components/ui/badge"
import type { JiraTicket } from "@/lib/jira-api"
import { TicketChatbot } from "@/components/ticket-chatbot"

export default function JiraTicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const ticketKey = params.key as string
  const { data: session } = useSession()
  const userEmail = session?.user?.email || ""
  const isMasterAccount = userEmail === "heyroy23415@gmail.com"

  const [ticket, setTicket] = useState<JiraTicket | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTicket = async () => {
    if (!ticketKey) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/jira/ticket/${ticketKey}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch ticket: ${response.statusText}`)
      }

      const data = await response.json()
      setTicket(data.ticket)
    } catch (error) {
      console.error("Error fetching ticket:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch ticket")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchTicket()
  }

  useEffect(() => {
    fetchTicket()
  }, [ticketKey])

  const extractEmailFromDescription = (description: string): string | null => {
    // Use the same pattern as in jira-api.ts for consistency
    const patterns = [
      /From:\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,6})(?=[A-Z]|\s|$|[^a-zA-Z0-9])/,
      /from:\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,6})(?=[A-Z]|\s|$|[^a-zA-Z0-9])/,
      /FROM:\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,6})(?=[A-Z]|\s|$|[^a-zA-Z0-9])/,
    ]

    for (const pattern of patterns) {
      const match = description.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }

    return null
  }

  const extractSolutionsSections = (description: string): string => {
    if (!description) return ""

    const lines = description.split("\n")
    let inSolutionsSection = false
    const solutionsLines: string[] = []

    for (const line of lines) {
      const trimmedLine = line.trim()

      // Check if we're entering a solutions section
      if (
        trimmedLine.toLowerCase().startsWith("possible solutions:") ||
        trimmedLine.toLowerCase().startsWith("explanation for solution")
      ) {
        inSolutionsSection = true
      }

      // If we're in solutions section, collect the lines
      if (inSolutionsSection) {
        solutionsLines.push(line)
      }
    }

    return solutionsLines.join("\n").trim()
  }

  const cleanDescription = (description: string, isMasterAccount: boolean): string => {
    if (!description) return ""

    if (isMasterAccount) {
      // Add line break after email if it's immediately followed by "Description Detail:"
      const withLineBreak = description.replace(
        /From:\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,6})(?=Description Detail:)/i,
        "From: $1\n",
      )
      return withLineBreak.trim()
    }

    // For non-master accounts, remove the "From:" line
    // This ensures we don't accidentally truncate "Description Detail:"
    const descriptionDetailIndex = description.indexOf("Description Detail:")
    if (descriptionDetailIndex > 0) {
      // Found "Description Detail:" - remove everything before it
      return description.substring(descriptionDetailIndex).trim()
    }

    // If "Description Detail:" is not found, try to remove just the "From:" line
    const cleaned = description.replace(/^From:\s*[^\n]+\n?/i, "")
    return cleaned.trim()
  }

  const removeSolutionsSections = (description: string): string => {
    if (!description) return ""

    const lines = description.split("\n")
    const filteredLines: string[] = []
    let inSolutionsSection = false

    for (const line of lines) {
      const trimmedLine = line.trim()

      // Check if we're entering a solutions section
      if (
        trimmedLine.toLowerCase().startsWith("possible solutions:") ||
        trimmedLine.toLowerCase().startsWith("explanation for solution")
      ) {
        inSolutionsSection = true
        continue
      }

      // If not in solutions section, keep the line
      if (!inSolutionsSection) {
        filteredLines.push(line)
      }
    }

    return filteredLines.join("\n").trim()
  }

  const formatDescription = (description: string) => {
    if (!description) return <p className="text-gray-300">No description provided</p>

    const preprocessed = description.replace(/(\d+\.\s+[^0-9]+?)(?=\d+\.)/g, "$1\n")
    const lines = preprocessed.split("\n")

    const sections: { header?: string; content: string[] }[] = []
    let currentSection: { header?: string; content: string[] } = { content: [] }

    const sectionHeaders = [
      "Description Detail:",
      "Steps to Reproduce:",
      "Expected Behavior:",
      "Actual Behavior:",
      "Critical Issues:",
      "Logs & Errors:",
      "Additional Details:",
      "Environment:",
      "Resolution:",
      "Timestamp:",
      "Language:",
      "Operating System:",
      "Application Version:",
      "Browser:",
      "Network:",
    ]

    for (const line of lines) {
      const trimmedLine = line.trim()
      if (!trimmedLine) continue

      // Check if line is a section header
      const matchedHeader = sectionHeaders.find((header) => trimmedLine.toLowerCase().startsWith(header.toLowerCase()))

      if (matchedHeader) {
        // Save previous section if it has content
        if (currentSection.header || currentSection.content.length > 0) {
          sections.push(currentSection)
        }

        // Extract just the header part (up to and including the colon)
        const headerEndIndex = trimmedLine.toLowerCase().indexOf(matchedHeader.toLowerCase()) + matchedHeader.length
        const header = trimmedLine.substring(0, headerEndIndex)
        const contentAfterHeader = trimmedLine.substring(headerEndIndex).trim()

        // Start new section with just the header
        currentSection = { header, content: [] }

        if (header.toLowerCase().includes("additional details") && contentAfterHeader) {
          // Split by looking ahead for patterns like "Key:" where Key starts with uppercase
          // This handles cases where all details are on one line
          const keyValuePairs = contentAfterHeader.split(/(?=[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+$$[^)]+$$)?:)/)

          keyValuePairs.forEach((pair) => {
            const trimmedPair = pair.trim()
            if (trimmedPair && trimmedPair.includes(":")) {
              currentSection.content.push(trimmedPair)
            }
          })
        } else if (contentAfterHeader) {
          const numberedItemsMatch = contentAfterHeader.match(/\d+[.)]/g)
          if (numberedItemsMatch && numberedItemsMatch.length > 1) {
            // Multiple numbered items on the same line - split them
            const splitItems = contentAfterHeader.split(/(?=\d+[.)])/)
            splitItems.forEach((item) => {
              const trimmedItem = item.trim()
              if (trimmedItem) {
                currentSection.content.push(trimmedItem)
              }
            })
          } else {
            // Single item or no numbered items - add as-is
            currentSection.content.push(contentAfterHeader)
          }
        }
      } else {
        const numberedItemsMatch = trimmedLine.match(/\d+[.)]/g)
        if (numberedItemsMatch && numberedItemsMatch.length > 1) {
          // Multiple numbered items on the same line - split them
          const splitItems = trimmedLine.split(/(?=\d+[.)])/)
          splitItems.forEach((item) => {
            const trimmedItem = item.trim()
            if (trimmedItem) {
              currentSection.content.push(trimmedItem)
            }
          })
        } else {
          currentSection.content.push(trimmedLine)
        }
      }
    }

    // Add the last section
    if (currentSection.header || currentSection.content.length > 0) {
      sections.push(currentSection)
    }

    return (
      <div className="space-y-6 text-gray-100">
        {sections.map((section, idx) => {
          const isStepsToReproduce = section.header?.toLowerCase().includes("steps to reproduce")

          const sequentialItems: string[] = []
          if (isStepsToReproduce) {
            section.content.forEach((line) => {
              const numberedMatch = line.match(/^(\d+)[.)]\s*(.+)/)
              if (numberedMatch) {
                const content = numberedMatch[2].trim()
                // Only include items with meaningful content
                if (content && !/^[\d\s.,;:!?()-]*$/.test(content)) {
                  sequentialItems.push(content)
                }
              }
            })
          }

          return (
            <div key={idx}>
              {section.header && (
                <h4 className="font-bold text-white text-base leading-relaxed mb-3">{section.header}</h4>
              )}
              {section.content.length > 0 && (
                <div className="space-y-3">
                  {isStepsToReproduce
                    ? sequentialItems.map((content, itemIdx) => (
                        <div key={itemIdx} className="flex items-start space-x-3 ml-4 mb-3">
                          <span className="text-gray-400 mt-1 select-none font-medium">{itemIdx + 1}.</span>
                          <p className="text-gray-300 flex-1 leading-relaxed">{content}</p>
                        </div>
                      ))
                    : section.content.map((line, lineIdx) => {
                        const bulletMatch = line.match(/^[•\-*]\s+(.+)/)
                        const numberedMatch = line.match(/^(\d+)[.)]\s*(.+?)(?=\s*\d+[.)]|$)/)

                        if (bulletMatch) {
                          return (
                            <div key={lineIdx} className="flex items-start space-x-3 ml-4">
                              <span className="text-gray-400 mt-1 select-none">•</span>
                              <p className="text-gray-300 flex-1 leading-relaxed">{bulletMatch[1]}</p>
                            </div>
                          )
                        }

                        if (numberedMatch) {
                          const content = numberedMatch[2].trim()
                          if (!content || /^[\d\s.,;:!?()-]*$/.test(content)) {
                            return null
                          }

                          return (
                            <div key={lineIdx} className="flex items-start space-x-3 ml-4 mb-3">
                              <span className="text-gray-400 mt-1 select-none">•</span>
                              <p className="text-gray-300 flex-1 leading-relaxed">{content}</p>
                            </div>
                          )
                        }

                        const keyValueMatch = line.match(/^([^:]+):\s*(.+)/)
                        if (keyValueMatch && section.header?.toLowerCase().includes("additional details")) {
                          return (
                            <p key={lineIdx} className="text-gray-300 leading-relaxed">
                              <span className="font-medium text-gray-200">{keyValueMatch[1]}:</span> {keyValueMatch[2]}
                            </p>
                          )
                        }

                        return (
                          <p key={lineIdx} className="text-gray-300 leading-relaxed">
                            {line}
                          </p>
                        )
                      })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase()
    if (statusLower.includes("progress") || statusLower.includes("development")) {
      return "bg-yellow-500"
    }
    if (statusLower.includes("done") || statusLower.includes("resolved")) {
      return "bg-green-500"
    }
    if (statusLower.includes("waiting") || statusLower.includes("pending")) {
      return "bg-blue-500"
    }
    return "bg-gray-500"
  }

  const getPriorityColor = (priority: string) => {
    const priorityLower = priority.toLowerCase()
    if (priorityLower.includes("highest") || priorityLower.includes("critical")) {
      return "bg-red-500"
    }
    if (priorityLower.includes("high")) {
      return "bg-orange-500"
    }
    if (priorityLower.includes("medium")) {
      return "bg-yellow-500"
    }
    return "bg-blue-500"
  }

  const handleDownloadAttachment = async (attachmentId: string, filename: string) => {
    try {
      console.log("[v0] Download button clicked")
      console.log("[v0] Attachment ID:", attachmentId)
      console.log("[v0] Filename:", filename)
      console.log("[v0] Fetching from:", `/api/jira/attachment/${attachmentId}`)

      const response = await fetch(`/api/jira/attachment/${attachmentId}`)

      console.log("[v0] Response status:", response.status)
      console.log("[v0] Response ok:", response.ok)
      console.log("[v0] Response headers:", Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[v0] Error response body:", errorText)
        throw new Error(`Failed to download attachment: ${response.status} ${response.statusText}`)
      }

      console.log("[v0] Creating blob from response")
      // Create a blob from the response
      const blob = await response.blob()
      console.log("[v0] Blob created, size:", blob.size, "type:", blob.type)

      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob)
      console.log("[v0] Blob URL created:", url)

      // Create a temporary anchor element and trigger download
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      console.log("[v0] Triggering download for:", filename)
      a.click()

      // Cleanup
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      console.log("[v0] Download completed successfully")
    } catch (error) {
      console.error("[v0] Error downloading attachment:", error)
      console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")
      alert("Failed to download attachment. Please try again.")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
          <h3 className="text-xl font-semibold text-white mb-2">Loading Ticket Details...</h3>
          <p className="text-gray-400">Fetching ticket information from Jira</p>
        </div>
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <Card className="max-w-md w-full bg-red-50 border-red-200">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <div>
                <CardTitle className="text-red-800">Error Loading Ticket</CardTitle>
                <CardDescription className="text-red-600">{error || "Ticket not found"}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const customerEmail = extractEmailFromDescription(ticket.description || "")
  const cleanedDescription = cleanDescription(ticket.description || "", isMasterAccount)
  const solutionsSections = extractSolutionsSections(cleanedDescription)
  const displayDescription = removeSolutionsSections(cleanedDescription)

  return (
    <div className="min-h-screen bg-black">
      <nav className="flex items-center justify-between p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-white">INTEGRUM</h1>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-2 bg-transparent"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </Button>
          <Button variant="outline" onClick={() => router.push("/?view=yourTickets")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Your Tickets
          </Button>
        </div>
      </nav>

      <section className="py-12 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-6">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Badge variant="outline" className="text-blue-400 border-blue-400">
                      {ticket.key}
                    </Badge>
                    {isMasterAccount && (
                      <Badge className={`${getStatusColor(ticket.status.name)} text-white`}>{ticket.status.name}</Badge>
                    )}
                    {isMasterAccount && (
                      <Badge className={`${getPriorityColor(ticket.priority.name)} text-white`}>
                        {ticket.priority.name}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-2xl text-white mb-2">{ticket.summary}</CardTitle>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-6">
                {isMasterAccount && (
                  <div className="flex items-center space-x-3 text-gray-300">
                    <User className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-xs text-gray-500">Reporter</p>
                      <p className="font-medium">{ticket.reporter.displayName}</p>
                      <p className="text-sm text-gray-400">{ticket.reporter.emailAddress}</p>
                    </div>
                  </div>
                )}

                {isMasterAccount && ticket.assignee && (
                  <div className="flex items-center space-x-3 text-gray-300">
                    <User className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-xs text-gray-500">Assignee</p>
                      <p className="font-medium">{ticket.assignee.displayName}</p>
                      <p className="text-sm text-gray-400">{ticket.assignee.emailAddress}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3 text-gray-300">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="text-xs text-gray-500">Created</p>
                    <p className="font-medium">{new Date(ticket.created).toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-gray-300">
                  <Calendar className="w-5 h-5 text-yellow-400" />
                  <div>
                    <p className="text-xs text-gray-500">Last Updated</p>
                    <p className="font-medium">{new Date(ticket.updated).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {!isMasterAccount && customerEmail && (
                <div className="p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-xs text-blue-300">Customer Email</p>
                      <p className="font-medium text-blue-200">{customerEmail}</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
                <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                  {formatDescription(displayDescription)}
                </div>
              </div>

              {ticket.attachments && ticket.attachments.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Attachments{" "}
                    <Badge variant="outline" className="ml-2">
                      {ticket.attachments.length}
                    </Badge>
                  </h3>
                  <div className="space-y-3">
                    {ticket.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{attachment.filename}</p>
                          <p className="text-sm text-gray-400">
                            {(attachment.size / 1024).toFixed(2)} KB • {attachment.mimeType}
                          </p>
                        </div>
                        <Button
                          onClick={() => handleDownloadAttachment(attachment.id, attachment.filename)}
                          size="sm"
                          className="ml-4 bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-4">
                <Button variant="outline" onClick={() => router.push("/?view=yourTickets")} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Your Tickets
                </Button>
                {isMasterAccount && (
                  <Button
                    onClick={() =>
                      window.open(`${process.env.NEXT_PUBLIC_JIRA_BASE_URL}/browse/${ticket.key}`, "_blank")
                    }
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    View in Jira
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="lg:sticky lg:top-6 lg:self-start">
            <TicketChatbot
              ticketKey={ticket.key}
              ticketTitle={ticket.summary}
              ticketDescription={displayDescription}
              solutionsSections={solutionsSections}
              currentUserEmail={userEmail}
              isMasterAccount={isMasterAccount}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
