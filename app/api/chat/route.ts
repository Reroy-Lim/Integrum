import { consumeStream, convertToModelMessages, streamText, type UIMessage } from "ai"

export const maxDuration = 30

export async function POST(req: Request) {
  const {
    messages,
    ticketContext,
    solutionsSections,
  }: { messages: UIMessage[]; ticketContext?: string; solutionsSections?: string } = await req.json()

  const prompt = convertToModelMessages(messages)

  if (ticketContext) {
    let systemContent = `You are a helpful IT support assistant. You are helping to resolve the following ticket:\n\n${ticketContext}\n\n`

    if (solutionsSections) {
      systemContent += `Here are the suggested solutions for this ticket:\n\n${solutionsSections}\n\n`
    }

    systemContent += `Provide helpful, professional responses to assist in resolving this issue. Reference the suggested solutions when relevant, ask clarifying questions when needed, and provide practical troubleshooting steps.`

    prompt.unshift({
      role: "system",
      content: systemContent,
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
