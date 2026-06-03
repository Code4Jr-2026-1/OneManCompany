import Anthropic from "@anthropic-ai/sdk"
import { NextResponse } from "next/server"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  const { message, history, context, rating, skillLevel, studentId } = await req.json()

  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === "sk-ant-...") {
    return NextResponse.json({
      reply: "AI mentor is not configured yet — your coach needs to add an Anthropic API key. For now, here's a tip: " +
        (skillLevel === "beginner" ? "Always develop your knights and bishops before your queen in the opening!" :
         skillLevel === "intermediate" ? "In the endgame, activate your king — it becomes a powerful piece!" :
         "Study the classics: Fischer, Kasparov, and Karpov games will sharpen your positional understanding."),
    })
  }

  const systemPrompt = `You are a warm, encouraging chess mentor with deep expertise. You are personalised for this specific student.

Student profile:
- Skill level: ${skillLevel}
- Rating: ${rating || "Unrated"}
- Personal context: ${context || "New student, no history yet"}

Guidelines:
- Adapt your language to their skill level (simpler for beginners, technical for advanced)
- Be encouraging and positive, especially after mistakes
- Provide concrete, actionable advice
- Use chess notation when helpful (e.g., 1.e4 e5 2.Nf3)
- Keep responses concise but complete (2-4 paragraphs max)
- Reference their personal context and goals when relevant`

  const apiMessages = [
    ...history.slice(-6).map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: message },
  ]

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemPrompt,
      messages: apiMessages,
    })
    const reply = response.content[0].type === "text" ? response.content[0].text : "Sorry, I couldn't generate a response."
    return NextResponse.json({ reply, studentId })
  } catch (err) {
    console.error("AI mentor error:", err)
    return NextResponse.json({ reply: "I'm having trouble connecting right now. Please try again in a moment." })
  }
}
