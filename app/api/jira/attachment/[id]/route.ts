import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookieStore = await cookies()
    const userEmail = cookieStore.get("user_email")?.value

    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const attachmentId = params.id
    const baseUrl = process.env.JIRA_BASE_URL?.replace(/\/$/, "")
    const email = process.env.JIRA_EMAIL
    const apiToken = process.env.JIRA_API_TOKEN

    if (!baseUrl || !email || !apiToken) {
      return NextResponse.json({ error: "Jira configuration missing" }, { status: 500 })
    }

    // Fetch attachment from Jira
    const auth = btoa(`${email}:${apiToken}`)
    const attachmentUrl = `${baseUrl}/rest/api/3/attachment/content/${attachmentId}`

    console.log("[v0] Downloading attachment:", attachmentId)

    const response = await fetch(attachmentUrl, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    })

    if (!response.ok) {
      console.error("[v0] Failed to download attachment:", response.statusText)
      return NextResponse.json({ error: "Failed to download attachment" }, { status: response.status })
    }

    // Get the file data
    const fileData = await response.arrayBuffer()
    const contentType = response.headers.get("content-type") || "application/octet-stream"
    const contentDisposition = response.headers.get("content-disposition") || ""

    // Extract filename from content-disposition header or use attachment ID
    let filename = `attachment-${attachmentId}`
    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1].replace(/['"]/g, "")
    }

    console.log("[v0] Attachment downloaded successfully:", filename)

    // Return the file with proper headers to trigger download
    return new NextResponse(fileData, {
      status: 200,
      headers: {
        "Content-Type": contentType,
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
