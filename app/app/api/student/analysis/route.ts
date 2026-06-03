import Anthropic from "@anthropic-ai/sdk" // eslint-disable-line
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  const { pgn, studentId, skillLevel } = await req.json()
  if (!pgn?.trim()) return NextResponse.json({ error: "No PGN provided" }, { status: 400 })

  const fallbackAnalysis = `Game received. AI analysis requires an Anthropic API key to be configured.\n\nQuick tip for ${skillLevel} players: ${
    skillLevel === "beginner" ? "Always ask: 'Why did my opponent make that move?' before responding." :
    skillLevel === "intermediate" ? "Look for imbalances — who has more space, better pieces, safer king?" :
    "Calculate forcing lines first, then evaluate the resulting positions."
  }`

  let analysis = fallbackAnalysis
  let patterns: string[] = []

  if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== "sk-ant-...") {
    try {
      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        messages: [{
          role: "user",
          content: `Analyse this chess game for a ${skillLevel} player. Provide:
1. A 3-4 sentence overall game summary
2. 2-3 key moments (good or bad) with the move numbers
3. Main areas for improvement
4. One concrete tip to work on

PGN:
${pgn}

Also list 2-4 patterns detected (e.g. "Weak king safety", "Good tactical vision", "Endgame mistakes") as a JSON array at the end like: PATTERNS:["pattern1","pattern2"]`
        }],
      })
      const text = response.content[0].type === "text" ? response.content[0].text : fallbackAnalysis
      const patternsMatch = text.match(/PATTERNS:\s*(\[[\s\S]*?\])/)
      if (patternsMatch) {
        try { patterns = JSON.parse(patternsMatch[1]) } catch {}
        analysis = text.replace(/PATTERNS:\s*\[[\s\S]*?\]/, "").trim()
      } else {
        analysis = text
      }
    } catch (err) {
      console.error("Analysis error:", err)
    }
  }

  if (studentId) {
    await prisma.gameAnalysis.create({
      data: { studentId, pgn, aiAnalysis: analysis, patternsDetected: JSON.stringify(patterns) },
    })
  }

  return NextResponse.json({ analysis, patterns })
}
