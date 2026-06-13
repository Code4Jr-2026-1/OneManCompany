import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { openai, MODEL } from "@/lib/openai"

export async function POST(req: Request) {
  const { studentId, studentName, topicsCovered, wellness, homeworkTasks, nextSessionDate, duration, transcript } = await req.json()

  // Build AI analysis from transcript + session data
  let aiSummary = `Session covered: ${topicsCovered}. Student energy: ${wellness}.`
  let aiAnalysis: string | null = null

  try {
    const hasTranscript = transcript && transcript.trim().length > 20

    const prompt = hasTranscript
      ? `You are an expert chess coach assistant. Analyse this coaching session and return a JSON object.

Student: ${studentName}
Topics covered: ${topicsCovered}
Student energy/wellness: ${wellness}
Duration: ${duration} minutes
Homework assigned: ${homeworkTasks?.join(", ") || "None"}

Session transcript / notes:
"""
${transcript}
"""

Return ONLY valid JSON in this exact format:
{
  "summary": "2-3 sentence overview of the session",
  "keyMoments": ["moment 1", "moment 2", "moment 3"],
  "studentPerformance": "1-2 sentences on how the student performed",
  "weaknessObserved": "Any weakness or pattern spotted this session",
  "nextSessionFocus": "What the coach should focus on next session",
  "homeworkRationale": "Why this homework was assigned and what it targets"
}`
      : `You are an expert chess coach assistant. Summarise this coaching session and return a JSON object.

Student: ${studentName}
Topics covered: ${topicsCovered}
Student energy/wellness: ${wellness}
Duration: ${duration} minutes
Homework assigned: ${homeworkTasks?.join(", ") || "None"}

Return ONLY valid JSON in this exact format:
{
  "summary": "2-3 sentence overview of the session",
  "keyMoments": [],
  "studentPerformance": "Brief note on the session",
  "weaknessObserved": "Unable to assess without transcript",
  "nextSessionFocus": "Continue working on ${topicsCovered}",
  "homeworkRationale": "Reinforces topics covered this session"
}`

    const res = await openai.chat.completions.create({
      model: MODEL,
      max_tokens: 600,
      temperature: 0.4,
      messages: [{ role: "user", content: prompt }],
    })

    const raw = res.choices[0].message.content ?? ""
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      aiSummary = parsed.summary ?? aiSummary
      aiAnalysis = JSON.stringify(parsed)
    }
  } catch {
    // keep fallback
  }

  // Save session
  await prisma.coachSession.create({
    data: {
      studentId,
      duration: duration || 60,
      topicsCovered,
      wellness,
      coachNotes: null,
      transcript: transcript || null,
      aiSummary,
      aiAnalysis,
      homeworkSet: homeworkTasks?.length ? homeworkTasks.join("; ") : null,
      nextSessionDate: nextSessionDate ? new Date(nextSessionDate) : null,
    },
  })

  // Save homework entries
  for (const task of (homeworkTasks ?? [])) {
    if (!task) continue
    await prisma.homework.create({
      data: {
        studentId,
        title: task,
        dueDate: nextSessionDate ? new Date(nextSessionDate) : null,
        status: "PENDING",
      },
    })
  }

  // Schedule next session
  if (nextSessionDate) {
    await prisma.scheduledSession.create({
      data: {
        studentId,
        scheduledAt: new Date(nextSessionDate),
        duration: duration || 60,
        status: "CONFIRMED",
      },
    })
  }

  await prisma.student.update({ where: { id: studentId }, data: { updatedAt: new Date() } })

  return NextResponse.json({ ok: true, aiSummary, aiAnalysis })
}
