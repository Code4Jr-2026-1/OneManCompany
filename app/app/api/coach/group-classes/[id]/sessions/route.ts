import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { openai, MODEL } from "@/lib/openai"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const coach = await prisma.user.findUnique({ where: { email: session.user!.email! } })
  if (!coach) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const groupClass = await prisma.groupClass.findFirst({ where: { id, coachId: coach.id } })
  if (!groupClass) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()
  const { date, topicsCovered, coachNotes, homework } = body

  // Create group session
  const groupSession = await prisma.groupSession.create({
    data: {
      groupClassId: id,
      date: new Date(date),
      topicsCovered: topicsCovered || null,
      coachNotes: coachNotes || null,
    },
  })

  // Assign homework to all ACTIVE enrolled students
  if (homework?.title) {
    const activeEnrollments = await prisma.groupEnrollment.findMany({
      where: { groupClassId: id, status: "ACTIVE" },
    })
    if (activeEnrollments.length > 0) {
      await prisma.homework.createMany({
        data: activeEnrollments.map(e => ({
          studentId: e.studentId,
          groupClassId: id,
          title: homework.title,
          description: homework.description || null,
          dueDate: homework.dueDate ? new Date(homework.dueDate) : null,
        })),
      })
    }
  }

  // Generate AI summary (fire and forget style — update after)
  try {
    const msg = await openai.chat.completions.create({
      model: MODEL,
      max_tokens: 200,
      messages: [{
        role: "user",
        content: `Write a concise 2-3 sentence summary of a chess group class session. Topics covered: ${topicsCovered || "not specified"}. Coach notes: ${coachNotes || "none"}. Be specific and professional.`,
      }],
    })
    const summary = msg.choices[0].message.content ?? ""
    await prisma.groupSession.update({ where: { id: groupSession.id }, data: { aiSummary: summary } })
  } catch {
    // Summary generation is non-blocking
  }

  return NextResponse.json(groupSession, { status: 201 })
}
