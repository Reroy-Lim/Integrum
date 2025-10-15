import { consumeStream, convertToModelMessages, streamText, type UIMessage } from "ai"

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages, ticketContext }: { messages: UIMessage[]; ticketContext?: string } = await req.json()

  const prompt = convertToModelMessages(messages)

  // Add ticket context as system message if provided
  if (ticketContext) {
    prompt.unshift({
      role: "system",
      content: `You are a helpful IT support assistant. You are helping to resolve the following ticket:\n\n${ticketContext}\n\nProvide helpful, professional responses to assist in resolving this issue. Ask clarifying questions when needed and suggest practical solutions.`,
    })
  }

  const result = streamText({
    model: "openai/gpt-5-mini",
    prompt,
    abortSignal: req.signal,
  })

  return result.toUIMessageStreamResponse({
    onFinish: async ({ isAborted }) => {
      if (isAborted) {
        console.log("[v0] Chat aborted")
      }
    },
    consumeSseStream: consumeStream,
  })
}
