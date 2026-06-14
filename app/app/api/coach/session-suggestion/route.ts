import { NextResponse } from "next/server"
import { openai, MODEL } from "@/lib/openai"

export async function POST(req: Request) {
  const { studentName, skillLevel, context, weakestTopic, nextPlanTopic, lastSessionTopic } = await req.json()

  const fallback = `Suggested focus for today:\n\n` +
    (weakestTopic ? `1. ${weakestTopic} — ${studentName}'s weakest area\n` : "") +
    (nextPlanTopic ? `2. Continue plan: ${nextPlanTopic}\n` : "") +
    (lastSessionTopic ? `3. Follow up: ${lastSessionTopic}\n` : "") +
    `\nStart with a 5-minute warm-up puzzle, then go into the main topic.`

  try {
    const res = await openai.chat.completions.create({
      model: MODEL,
      max_tokens: 400,
      temperature: 0.5,
      messages: [{
        role: "user",
        content: `You are a ChessMate AI assistant helping a chess coach prepare for their next session with ${studentName} (${skillLevel} player).

Student context: ${context || "Limited context available"}
Weakest topic: ${weakestTopic || "Unknown"}
Next planned topic: ${nextPlanTopic || "Not set"}
Last session covered: ${lastSessionTopic || "No previous session"}

Write a concise 3-4 line session plan. Include:
- What to focus on (1-2 topics max)
- One specific exercise or position to show
- What homework to set

Be specific and practical. No fluff.`
      }],
    })
    return NextResponse.json({ suggestion: res.choices[0].message.content ?? fallback })
  } catch {
    return NextResponse.json({ suggestion: fallback })
  }
}
