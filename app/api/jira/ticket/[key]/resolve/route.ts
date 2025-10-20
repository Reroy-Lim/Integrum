import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { key: string } }) {
  try {
    const ticketKey = params.key

    if (!ticketKey) {
      return NextResponse.json({ error: "Ticket key is required" }, { status: 400 })
    }

    const baseUrl = process.env.JIRA_BASE_URL
    const email = process.env.JIRA_EMAIL
    const apiToken = process.env.JIRA_API_TOKEN

    if (!baseUrl || !email || !apiToken) {
      return NextResponse.json({ error: "Jira configuration missing" }, { status: 500 })
    }

    // First, get available transitions for this issue
    const transitionsUrl = `${baseUrl}/rest/api/3/issue/${ticketKey}/transitions`
    const auth = Buffer.from(`${email}:${apiToken}`).toString("base64")

    const transitionsResponse = await fetch(transitionsUrl, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
    })

    if (!transitionsResponse.ok) {
      throw new Error(`Failed to fetch transitions: ${transitionsResponse.statusText}`)
    }

    const transitionsData = await transitionsResponse.json()

    // Find the "Done" or "Resolved" transition
    const resolveTransition = transitionsData.transitions.find(
      (t: any) =>
        t.name.toLowerCase() === "done" ||
        t.name.toLowerCase() === "resolved" ||
        t.to.name.toLowerCase() === "done" ||
        t.to.name.toLowerCase() === "resolved",
    )

    if (!resolveTransition) {
      return NextResponse.json(
        {
          error: "No resolve transition available for this ticket",
        },
        { status: 400 },
      )
    }

    // Perform the transition
    const transitionUrl = `${baseUrl}/rest/api/3/issue/${ticketKey}/transitions`
    const transitionResponse = await fetch(transitionUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        transition: {
          id: resolveTransition.id,
        },
      }),
    })

    if (!transitionResponse.ok) {
      const errorText = await transitionResponse.text()
      console.error("[v0] Error transitioning ticket:", errorText)
      throw new Error(`Failed to resolve ticket: ${transitionResponse.statusText}`)
    }

    console.log("[v0] Ticket", ticketKey, "resolved successfully")

    return NextResponse.json({
      success: true,
      message: "Ticket resolved successfully",
    })
  } catch (error) {
    console.error("[v0] Error resolving ticket:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to resolve ticket" },
      { status: 500 },
    )
  }
}
