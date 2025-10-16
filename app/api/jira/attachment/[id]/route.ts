import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies()
    const userEmail = cookieStore.get("user_email")?.value

    if (!userEmail) {
      console.log("[v0] Unauthorized: No user email in cookies")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const attachmentId = params.id
    const baseUrl = process.env.JIRA_BASE_URL?.replace(/\/$/, "")
    const email = process.env.JIRA_EMAIL
    const apiToken = process.env.JIRA_API_TOKEN

    if (!baseUrl || !email || !apiToken) {
      console.error("[v0] Jira configuration missing")
      return NextResponse.json({ error: "Jira configuration missing" }, { status: 500 })
    }

    const auth = btoa(`${email}:${apiToken}`)
    // First, get the attachment metadata to get the correct download URL
    const metadataUrl = `${baseUrl}/rest/api/3/attachment/${attachmentId}`

    console.log("[v0] Fetching attachment metadata:", attachmentId)

    const metadataResponse = await fetch(metadataUrl, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
    })

    if (!metadataResponse.ok) {
      console.error("[v0] Failed to fetch attachment metadata:", metadataResponse.status, metadataResponse.statusText)
      const errorText = await metadataResponse.text()
      console.error("[v0] Error response:", errorText)
      return NextResponse.json({ error: "Failed to fetch attachment metadata" }, { status: metadataResponse.status })
    }

    const metadata = await metadataResponse.json()
    const downloadUrl = metadata.content // This is the correct download URL from Jira
    const filename = metadata.filename
    const mimeType = metadata.mimeType

    console.log("[v0] Downloading attachment from:", downloadUrl)

    // Now download the actual file content
    const response = await fetch(downloadUrl, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    })

    if (!response.ok) {
      console.error("[v0] Failed to download attachment:", response.status, response.statusText)
      const errorText = await response.text()
      console.error("[v0] Error response:", errorText)
      return NextResponse.json({ error: "Failed to download attachment" }, { status: response.status })
    }

    // Get the file data
    const fileData = await response.arrayBuffer()

    console.log("[v0] Attachment downloaded successfully:", filename, "Size:", fileData.byteLength, "bytes")

    // Return the file with proper headers to trigger download
    return new NextResponse(fileData, {
      status: 200,
      headers: {
        "Content-Type": mimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": fileData.byteLength.toString(),
      },
    })
  } catch (error) {
    console.error("[v0] Error downloading attachment:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to download attachment" },
      { status: 500 },
    )
  }
}
