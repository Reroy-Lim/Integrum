import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const jiraConfig = {
      baseUrl: process.env.JIRA_BASE_URL || "",
      email: process.env.JIRA_EMAIL || "",
      apiToken: process.env.JIRA_API_TOKEN || "",
      projectKey: process.env.JIRA_PROJECT_KEY || "KST",
    }

    console.log("[v0] Jira Test: Configuration check")
    console.log("[v0] Jira Test: Base URL:", jiraConfig.baseUrl)
    console.log("[v0] Jira Test: Email:", jiraConfig.email)
    console.log("[v0] Jira Test: API Token exists:", !!jiraConfig.apiToken)
    console.log("[v0] Jira Test: Project Key:", jiraConfig.projectKey)

    if (!jiraConfig.baseUrl || !jiraConfig.email || !jiraConfig.apiToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing Jira configuration",
          config: {
            hasBaseUrl: !!jiraConfig.baseUrl,
            hasEmail: !!jiraConfig.email,
            hasApiToken: !!jiraConfig.apiToken,
            projectKey: jiraConfig.projectKey,
          },
        },
        { status: 500 },
      )
    }

    // Test Jira API connection
    const auth = btoa(`${jiraConfig.email}:${jiraConfig.apiToken}`)
    const testUrl = `${jiraConfig.baseUrl}/rest/api/3/myself`

    console.log("[v0] Jira Test: Testing connection to:", testUrl)

    const response = await fetch(testUrl, {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
    })

    console.log("[v0] Jira Test: Response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Jira Test: Error response:", errorText)
      return NextResponse.json(
        {
          success: false,
          error: "Jira API connection failed",
          status: response.status,
          statusText: response.statusText,
          details: errorText,
        },
        { status: 500 },
      )
    }

    const userData = await response.json()
    console.log("[v0] Jira Test: Successfully connected as:", userData.emailAddress)

    // Test fetching tickets
    const jql = `project = "${jiraConfig.projectKey}" ORDER BY created DESC`
    const searchUrl = `${jiraConfig.baseUrl}/rest/api/3/search`

    console.log("[v0] Jira Test: Testing ticket search with JQL:", jql)

    const searchResponse = await fetch(searchUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jql,
        maxResults: 5,
        fields: ["summary", "status", "created", "reporter"],
      }),
    })

    console.log("[v0] Jira Test: Search response status:", searchResponse.status)

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text()
      console.error("[v0] Jira Test: Search error response:", errorText)
      return NextResponse.json(
        {
          success: false,
          error: "Jira ticket search failed",
          status: searchResponse.status,
          statusText: searchResponse.statusText,
          details: errorText,
        },
        { status: 500 },
      )
    }

    const searchData = await searchResponse.json()
    console.log("[v0] Jira Test: Found", searchData.total, "tickets")

    return NextResponse.json({
      success: true,
      message: "Jira API connection successful",
      user: {
        email: userData.emailAddress,
        displayName: userData.displayName,
      },
      tickets: {
        total: searchData.total,
        returned: searchData.issues?.length || 0,
        sample: searchData.issues?.slice(0, 3).map((issue: any) => ({
          key: issue.key,
          summary: issue.fields.summary,
          status: issue.fields.status.name,
          created: issue.fields.created,
        })),
      },
    })
  } catch (error) {
    console.error("[v0] Jira Test: Unexpected error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Unexpected error testing Jira connection",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
