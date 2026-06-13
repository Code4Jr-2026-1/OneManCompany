import Anthropic from "@anthropic-ai/sdk"
import { NextResponse } from "next/server"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  const { studentName, skillLevel, context, weakestTopic, nextPlanTopic, lastSessionTopic } = await req.json()

  const fallback = `Suggested focus for today:\n\n` +
    (weakestTopic ? `1. ${weakestTopic} — this is ${studentName}'s weakest area (needs most attention)\n` : "") +
    (nextPlanTopic ? `2. Continue plan: ${nextPlanTopic}\n` : "") +
    (lastSessionTopic ? `3. Follow up on last session: ${lastSessionTopic}\n` : "") +
    `\nStart with a 5-minute warm-up puzzle, then go into the main topic. End with homework assignment.`

  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === "sk-ant-...") {
    return NextResponse.json({ suggestion: fallback })
  }

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      messages: [{
        role: "user",
        content: `You are helping a chess coach prepare for their next session with ${studentName} (${skillLevel} player).

Context about the student: ${context || "Limited context available"}
Weakest topic: ${weakestTopic || "Unknown"}
Next planned topic: ${nextPlanTopic || "Not set"}
Last session covered: ${lastSessionTopic || "No previous session"}

Write a concise 3-4 line session plan for today. Include:
- What to focus on (1-2 topics max)
- One specific exercise or position to show
- What homework to set

Be specific and practical. No fluff.`
      }],
    })
    const text = response.content[0].type === "text" ? response.content[0].text : fallback
    return NextResponse.json({ suggestion: text })
  } catch {
    return NextResponse.json({ suggestion: fallback })
  }
}
