import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const coach = await prisma.user.findUnique({ where: { email: session.user!.email! } })
  if (!coach) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const scheduled = await prisma.scheduledSession.findFirst({
    where: { id: sessionId },
    include: { student: { select: { coachId: true } } },
  })
  if (!scheduled || scheduled.student.coachId !== coach.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()
  const { topicsCovered, coachNotes, duration } = body

  const [, coachSession] = await prisma.$transaction([
    prisma.scheduledSession.update({ where: { id: sessionId }, data: { status: "COMPLETED" } }),
    prisma.coachSession.create({
      data: {
        studentId: scheduled.studentId,
        date: scheduled.scheduledAt,
        duration: duration ?? scheduled.duration,
        topicsCovered: topicsCovered || null,
        coachNotes: coachNotes || null,
      },
    }),
  ])

  return NextResponse.json(coachSession, { status: 201 })
}
