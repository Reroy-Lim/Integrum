import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { key: string } }) {
  try {
    const ticketKey = params.key

    if (!ticketKey) {
      return NextResponse.json({ error: "Ticket key is required" }, { status: 400 })
    }

    const jiraBaseUrl = process.env.JIRA_BASE_URL
    const jiraEmail = process.env.JIRA_EMAIL
    const jiraApiToken = process.env.JIRA_API_TOKEN

    if (!jiraBaseUrl || !jiraEmail || !jiraApiToken) {
      return NextResponse.json({ error: "Jira configuration missing" }, { status: 500 })
    }

    console.log("[v0] Resolving ticket:", ticketKey)

    // First, get available transitions for this ticket
    const transitionsResponse = await fetch(`${jiraBaseUrl}/rest/api/3/issue/${ticketKey}/transitions`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${btoa(`${jiraEmail}:${jiraApiToken}`)}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })

    if (!transitionsResponse.ok) {
      throw new Error(`Failed to fetch transitions: ${transitionsResponse.statusText}`)
    }

    const transitionsData = await transitionsResponse.json()
    console.log("[v0] Available transitions:", transitionsData.transitions)

    // First try to find "Closed" transition (highest priority)
    let resolveTransition = transitionsData.transitions.find(
      (t: any) =>
        t.name.toLowerCase() === "closed" ||
        t.name.toLowerCase() === "close" ||
        t.to.name.toLowerCase() === "closed" ||
        t.to.name.toLowerCase() === "close",
    )

    // If no "Closed" transition, try "Done"
    if (!resolveTransition) {
      resolveTransition = transitionsData.transitions.find(
        (t: any) => t.name.toLowerCase() === "done" || t.to.name.toLowerCase() === "done",
      )
    }

    // If no "Done" transition, try "Resolved"
    if (!resolveTransition) {
      resolveTransition = transitionsData.transitions.find(
        (t: any) => t.name.toLowerCase() === "resolved" || t.to.name.toLowerCase() === "resolved",
      )
    }

    if (!resolveTransition) {
      console.error(
        "[v0] No close/resolve transition found. Available:",
        transitionsData.transitions.map((t: any) => t.name),
      )
      return NextResponse.json(
        { error: "No close/resolve transition available for this ticket", transitions: transitionsData.transitions },
        { status: 400 },
      )
    }

    console.log("[v0] Using transition:", resolveTransition.name, "ID:", resolveTransition.id)

    // Perform the transition
    const transitionResponse = await fetch(`${jiraBaseUrl}/rest/api/3/issue/${ticketKey}/transitions`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${jiraEmail}:${jiraApiToken}`)}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transition: {
          id: resolveTransition.id,
        },
      }),
    })

    if (!transitionResponse.ok) {
      const errorText = await transitionResponse.text()
      console.error("[v0] Transition failed:", errorText)
      throw new Error(`Failed to resolve ticket: ${transitionResponse.statusText}`)
    }

    console.log("[v0] Ticket closed/resolved successfully:", ticketKey)

    return NextResponse.json({
      success: true,
      message: "Ticket closed successfully",
      ticketKey,
      transition: resolveTransition.name,
    })
  } catch (error) {
    console.error("[v0] Error resolving ticket:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to resolve ticket" },
      { status: 500 },
    )
  }
}
