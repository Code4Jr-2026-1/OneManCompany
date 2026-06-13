import { NextResponse } from "next/server"
import { openai, MODEL } from "@/lib/openai"

export async function POST(req: Request) {
  const { message, history, context, rating, skillLevel, studentId } = await req.json()

  const systemPrompt = `You are a warm, encouraging chess mentor with deep expertise, personalised for this student.

Student profile:
- Skill level: ${skillLevel}
- Rating: ${rating || "Unrated"}
- Personal context: ${context || "New student, no history yet"}

Guidelines:
- Adapt language to their skill level (simpler for beginners, technical for advanced)
- Be encouraging and positive, especially after mistakes
- Give concrete, actionable advice
- Use chess notation when helpful (e.g. 1.e4 e5 2.Nf3)
- Keep responses concise (2-4 paragraphs max)
- Reference their personal context and goals when relevant`

  const messages: { role: "user" | "assistant" | "system"; content: string }[] = [
    { role: "system", content: systemPrompt },
    ...history.slice(-6).map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: message },
  ]

  try {
    const res = await openai.chat.completions.create({
      model: MODEL,
      max_tokens: 1024,
      temperature: 0.6,
      messages,
    })
    const reply = res.choices[0].message.content ?? "Sorry, I couldn't generate a response."
    return NextResponse.json({ reply, studentId })
  } catch (err) {
    console.error("AI mentor error:", err)
    return NextResponse.json({ reply: "I'm having trouble connecting right now. Please try again." })
  }
}
