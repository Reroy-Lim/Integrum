export interface GmailMessage {
  id: string
  threadId: string
}

export interface GmailListResponse {
  messages?: GmailMessage[]
  resultSizeEstimate: number
}

export async function getSentEmails(accessToken: string): Promise<GmailListResponse> {
  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?q=in:sent&maxResults=1", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    throw new Error("Failed to fetch sent emails")
  }

  return response.json()
}

export async function getLatestSentEmailId(accessToken: string): Promise<string | null> {
  try {
    const data = await getSentEmails(accessToken)
    return data.messages?.[0]?.id || null
  } catch (error) {
    console.error("[v0] Error fetching latest sent email:", error)
    return null
  }
}
