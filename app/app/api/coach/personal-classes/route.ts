import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET — upcoming + recent personal sessions
export async function GET() {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const coach = await prisma.user.findUnique({ where: { email: session.user!.email! } })
  if (!coach) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const now = new Date()

  const students = await prisma.student.findMany({ where: { coachId: coach.id }, select: { id: true } })
  const studentIds = students.map(s => s.id)

  const [upcoming, recent] = await Promise.all([
    prisma.scheduledSession.findMany({
      where: { studentId: { in: studentIds }, scheduledAt: { gte: now }, status: "PENDING" },
      include: { student: { select: { id: true, name: true, skillLevel: true } } },
      orderBy: { scheduledAt: "asc" },
      take: 20,
    }),
    prisma.coachSession.findMany({
      where: { studentId: { in: studentIds } },
      include: { student: { select: { id: true, name: true } } },
      orderBy: { date: "desc" },
      take: 10,
    }),
  ])

  return NextResponse.json({ upcoming, recent })
}

// POST — quick book with conflict detection
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const coach = await prisma.user.findUnique({ where: { email: session.user!.email! } })
  if (!coach) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { studentId, scheduledAt, duration } = await req.json()
  const start = new Date(scheduledAt)
  const end = new Date(start.getTime() + Number(duration) * 60000)

  // Conflict check — other private sessions
  const students = await prisma.student.findMany({ where: { coachId: coach.id }, select: { id: true } })
  const studentIds = students.map(s => s.id)

  const conflicts = await prisma.scheduledSession.findMany({
    where: {
      studentId: { in: studentIds },
      status: "PENDING",
      scheduledAt: { lt: end },
    },
    include: { student: { select: { name: true } } },
  })

  const overlapping = conflicts.filter(c => {
    const cEnd = new Date(new Date(c.scheduledAt).getTime() + c.duration * 60000)
    return cEnd > start
  })

  if (overlapping.length > 0) {
    return NextResponse.json(
      { error: `Time conflicts with ${overlapping.map(c => c.student.name).join(", ")}'s session` },
      { status: 409 }
    )
  }

  // Group class conflict check
  const groupClasses = await prisma.groupClass.findMany({ where: { coachId: coach.id, isActive: true } })
  const dayOfWeek = start.getDay()
  const groupConflict = groupClasses.find(gc => {
    if (gc.dayOfWeek !== dayOfWeek) return false
    const [h, m] = gc.startTime.split(":").map(Number)
    const gcStart = new Date(start)
    gcStart.setHours(h, m, 0, 0)
    const gcEnd = new Date(gcStart.getTime() + gc.duration * 60000)
    return start < gcEnd && end > gcStart
  })

  if (groupConflict) {
    return NextResponse.json(
      { error: `Time conflicts with group class "${groupConflict.name}"` },
      { status: 409 }
    )
  }

  const newSession = await prisma.scheduledSession.create({
    data: { studentId, scheduledAt: start, duration: Number(duration) },
  })

  return NextResponse.json(newSession, { status: 201 })
}
