import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { openai, MODEL } from "@/lib/openai"

export async function POST(req: NextRequest) {
  const { studentId, topicsCovered, wellness } = await req.json()

  // Fetch student context + last session AI analysis
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      context: true,
      coachSessions: { orderBy: { date: "desc" }, take: 1 },
      plans: { where: { isActive: true }, take: 1 },
    },
  })

  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 })

  const lastSession = student.coachSessions[0]
  let lastAnalysis: { weaknessObserved?: string; nextSessionFocus?: string; keyMoments?: string[] } = {}
  try {
    if (lastSession?.aiAnalysis) lastAnalysis = JSON.parse(lastSession.aiAnalysis)
  } catch { /* ignore */ }

  const planTopics: string[] = []
  try {
    if (student.plans[0]?.topics) planTopics.push(...JSON.parse(student.plans[0].topics))
  } catch { /* ignore */ }

  const prompt = `You are an expert chess coach. Suggest exactly 3 specific, actionable homework tasks for a student based on their session.

STUDENT: ${student.name} (${student.skillLevel}, rating ${student.rating})
TOPICS COVERED TODAY: ${topicsCovered || "General chess practice"}
STUDENT ENERGY: ${wellness || "normal"}
KNOWN WEAKNESSES: ${student.weakness || "Not specified"}
IMPROVEMENT PLAN TOPICS: ${planTopics.join(", ") || "Not set"}
LAST SESSION WEAKNESS SPOTTED: ${lastAnalysis.weaknessObserved || "None noted"}
SUGGESTED NEXT FOCUS: ${lastAnalysis.nextSessionFocus || "Continue current topics"}
STUDENT CONTEXT: ${student.context?.contextSummary?.slice(0, 300) || "New student"}

Return ONLY a JSON array of exactly 3 homework tasks. Each task must be specific and completable at home. Format:
[
  { "title": "short task name", "description": "clear instruction of what to do", "estimatedMinutes": 15 },
  { "title": "short task name", "description": "clear instruction of what to do", "estimatedMinutes": 20 },
  { "title": "short task name", "description": "clear instruction of what to do", "estimatedMinutes": 10 }
]

Make tasks:
- Specific (e.g. "Solve 20 pin tactics on Lichess" not just "do tactics")
- Varied (mix of tactics, theory, and practice game review)
- Appropriate for ${student.skillLevel} level
- Directly related to today's topics and known weaknesses`

  try {
    const res = await openai.chat.completions.create({
      model: MODEL,
      max_tokens: 500,
      temperature: 0.5,
      messages: [{ role: "user", content: prompt }],
    })

    const raw = res.choices[0].message.content ?? ""
    const match = raw.match(/\[[\s\S]*\]/)
    if (!match) throw new Error("No JSON array in response")

    const suggestions = JSON.parse(match[0])
    return NextResponse.json({ suggestions })
  } catch (err) {
    console.error("[suggest-homework] Error:", err)
    // Fallback suggestions based on topics
    return NextResponse.json({
      suggestions: [
        {
          title: `Practise ${topicsCovered || "today's topics"}`,
          description: `Spend 15 minutes reviewing the concepts from today's session. Set up the positions we covered and play through them again.`,
          estimatedMinutes: 15,
        },
        {
          title: "Solve 20 tactics puzzles",
          description: "Go to Lichess.org → Puzzles and solve 20 puzzles at your current rating level. Focus on patterns similar to today's session.",
          estimatedMinutes: 20,
        },
        {
          title: "Play 2 slow games online",
          description: "Play 2 games with at least 10 minutes per side. After each game, spend 5 minutes finding your biggest mistake.",
          estimatedMinutes: 30,
        },
      ],
    })
  }
}
