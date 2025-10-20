import { type NextRequest, NextResponse } from "next/server"

export async function PUT(request: NextRequest, { params }: { params: { key: string } }) {
  try {
    const ticketKey = params.key
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 })
    }

    console.log("[v0] Updating ticket status:", ticketKey, "to", status)

    // Get Jira configuration
    const jiraConfig = {
      baseUrl: process.env.JIRA_BASE_URL || "",
      email: process.env.JIRA_EMAIL || "",
      apiToken: process.env.JIRA_API_TOKEN || "",
    }

    // Get available transitions for the ticket
    const transitionsResponse = await fetch(`${jiraConfig.baseUrl}/rest/api/3/issue/${ticketKey}/transitions`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${btoa(`${jiraConfig.email}:${jiraConfig.apiToken}`)}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })

    if (!transitionsResponse.ok) {
      throw new Error(`Failed to fetch transitions: ${transitionsResponse.statusText}`)
    }

    const transitionsData = await transitionsResponse.json()
    console.log("[v0] Available transitions:", transitionsData.transitions)

    // Find the transition ID for the desired status
    const targetTransition = transitionsData.transitions.find(
      (t: any) => t.name.toLowerCase() === status.toLowerCase() || t.to.name.toLowerCase() === status.toLowerCase(),
    )

    if (!targetTransition) {
      console.error("[v0] Could not find transition for status:", status)
      console.error(
        "[v0] Available transitions:",
        transitionsData.transitions.map((t: any) => t.name),
      )
      return NextResponse.json(
        {
          error: `Status transition '${status}' not available`,
          availableTransitions: transitionsData.transitions.map((t: any) => t.name),
        },
        { status: 400 },
      )
    }

    console.log("[v0] Found transition:", targetTransition.name, "ID:", targetTransition.id)

    // Perform the transition
    const updateResponse = await fetch(`${jiraConfig.baseUrl}/rest/api/3/issue/${ticketKey}/transitions`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${jiraConfig.email}:${jiraConfig.apiToken}`)}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transition: {
          id: targetTransition.id,
        },
      }),
    })

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text()
      console.error("[v0] Failed to update ticket status:", errorText)
      throw new Error(`Failed to update ticket status: ${updateResponse.statusText}`)
    }

    console.log("[v0] Ticket status updated successfully")

    return NextResponse.json({
      success: true,
      message: "Ticket status updated successfully",
      transition: targetTransition.name,
    })
  } catch (error) {
    console.error("[v0] Error updating ticket status:", error)
    return NextResponse.json(
      {
        error: "Failed to update ticket status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
