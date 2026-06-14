import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { openai, MODEL } from "@/lib/openai"

export async function POST(req: Request) {
  const { studentId } = await req.json()

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      context: true,
      coachSessions: { orderBy: { date: "desc" }, take: 5 },
      snapshots: { orderBy: { month: "desc" }, take: 2 },
      homeworkAssignments: { orderBy: { createdAt: "desc" }, take: 5 },
      plans: { where: { isActive: true }, take: 1 },
    },
  })
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 })

  const currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const snapshot = student.snapshots[0]
  const prevSnapshot = student.snapshots[1]
  const ratingChange = snapshot && prevSnapshot ? snapshot.rating - prevSnapshot.rating : 0
  const recentSessions = student.coachSessions
  const pendingHw = student.homeworkAssignments.filter(h => h.status === "PENDING")
  const completedHw = student.homeworkAssignments.filter(h => h.status === "DONE")

  const sessionInsights = recentSessions
    .filter(s => s.aiSummary)
    .map(s => {
      let extra = ""
      try {
        if (s.aiAnalysis) {
          const a = JSON.parse(s.aiAnalysis)
          if (a.weaknessObserved && !a.weaknessObserved.toLowerCase().includes("unable"))
            extra = ` Weakness: ${a.weaknessObserved}.`
          if (a.nextSessionFocus) extra += ` Focus: ${a.nextSessionFocus}.`
        }
      } catch { /* ignore */ }
      return `- ${new Date(s.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}: ${s.aiSummary}${extra}`
    })
    .join("\n")

  const prompt = `You are a professional chess coach writing a monthly progress report for a student. Write it in a warm, encouraging tone suitable for the student and their coach to review.

STUDENT PROFILE:
Name: ${student.name}
Age: ${student.age ?? "Not specified"}
Skill level: ${student.skillLevel}
Current rating: ${student.rating}${ratingChange !== 0 ? ` (${ratingChange > 0 ? "+" : ""}${ratingChange} this month)` : ""}
Known weaknesses: ${student.weakness ?? "Not recorded"}
Goals: ${student.goals ?? "Not specified"}

THIS MONTH'S STATS:
Sessions attended: ${snapshot?.sessionCount ?? recentSessions.length}
Improvement rate: ${Math.round(snapshot?.improvementRate ?? 0)}%

RECENT SESSION HIGHLIGHTS:
${sessionInsights || "No session data available this month."}

HOMEWORK:
Completed: ${completedHw.length} tasks
Pending: ${pendingHw.length} tasks
${pendingHw.length > 0 ? `Pending items: ${pendingHw.map(h => h.title).join(", ")}` : ""}

AI CONTEXT SUMMARY:
${student.context?.contextSummary ?? "No context available."}

Write a structured progress report with these sections:
1. **Overview** — 2-3 sentences summarising the month
2. **What We Worked On** — topics and skills covered this month
3. **Progress & Strengths** — what the student did well, rating progress
4. **Areas for Improvement** — honest but encouraging note on weaknesses
5. **Homework & Practice** — homework completion and what to practise at home
6. **Next Month's Focus** — what we'll work on next

Keep it between 250-350 words. Professional but warm. Do NOT address it "Dear Parent" — write it as a standalone report.`

  const fallback = `Progress Report — ${student.name} — ${new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}\n\nSessions this month: ${snapshot?.sessionCount ?? 0} | Rating: ${student.rating} (${ratingChange >= 0 ? "+" : ""}${ratingChange})\n\n${student.name} has been working hard this month. We focused on improving core chess skills and continue to make steady progress.`

  let content = fallback
  let aiUsed = false
  let aiError: string | null = null

  try {
    const res = await openai.chat.completions.create({
      model: MODEL,
      max_tokens: 700,
      temperature: 0.6,
      messages: [{ role: "user", content: prompt }],
    })
    const aiContent = res.choices[0].message.content
    if (aiContent) {
      content = aiContent
      aiUsed = true
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    aiError = msg
    console.error(`[generate-report] OpenAI failed for ${student.name}:`, msg)
    // keep fallback content
  }

  const existing = await prisma.parentReport.findFirst({
    where: { studentId, month: currentMonth, status: "DRAFT" },
  })

  if (existing) {
    await prisma.parentReport.update({ where: { id: existing.id }, data: { content } })
  } else {
    await prisma.parentReport.create({
      data: { studentId, month: currentMonth, content, status: "DRAFT" },
    })
  }

  return NextResponse.json({ ok: true, aiUsed, aiError, studentName: student.name })
}
