import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { monthBounds } from "@/lib/billing"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json() as {
    classType: "private" | "group"
    classId: string
    date: string
    attendees: { studentId: string; present: boolean; topic?: string }[]
  }

  const { classType, classId, date, attendees } = body
  const sessionDate = new Date(date)
  const presentStudents = attendees.filter(a => a.present)

  const coach = await prisma.user.findUnique({ where: { email: session.user!.email! } })
  if (!coach) return NextResponse.json({ error: "Coach not found" }, { status: 404 })

  let updated = false

  if (classType === "private") {
    // Verify the scheduled session belongs to this coach
    const scheduledSession = await prisma.scheduledSession.findFirst({
      where: { id: classId, student: { coachId: coach.id } },
      include: { student: true },
    })
    if (!scheduledSession) return NextResponse.json({ error: "Session not found" }, { status: 404 })

    const topic = attendees[0]?.topic ?? null

    // Check for existing CoachSession for this student on this date (same day)
    const dayStart = new Date(sessionDate); dayStart.setHours(0, 0, 0, 0)
    const dayEnd   = new Date(dayStart.getTime() + 86400000)

    const existing = await prisma.coachSession.findFirst({
      where: { studentId: scheduledSession.studentId, date: { gte: dayStart, lt: dayEnd } },
    })

    if (existing) {
      await prisma.coachSession.update({
        where: { id: existing.id },
        data: { topicsCovered: topic, duration: scheduledSession.duration },
      })
      updated = true
    } else {
      await prisma.coachSession.create({
        data: {
          studentId: scheduledSession.studentId,
          date: sessionDate,
          duration: scheduledSession.duration,
          topicsCovered: topic,
        },
      })
    }
  } else {
    // Group class
    const groupClass = await prisma.groupClass.findFirst({
      where: { id: classId, coachId: coach.id },
    })
    if (!groupClass) return NextResponse.json({ error: "Group class not found" }, { status: 404 })

    const dayStart = new Date(sessionDate); dayStart.setHours(0, 0, 0, 0)
    const dayEnd   = new Date(dayStart.getTime() + 86400000)
    const topic = presentStudents[0]?.topic ?? null

    // Upsert GroupSession
    const existingGroupSession = await prisma.groupSession.findFirst({
      where: { groupClassId: classId, date: { gte: dayStart, lt: dayEnd } },
    })

    if (existingGroupSession) {
      await prisma.groupSession.update({
        where: { id: existingGroupSession.id },
        data: { topicsCovered: topic },
      })
      updated = true
    } else {
      await prisma.groupSession.create({
        data: { groupClassId: classId, date: sessionDate, topicsCovered: topic },
      })
    }

    // Create CoachSession per attending student
    for (const attendee of presentStudents) {
      const existing = await prisma.coachSession.findFirst({
        where: { studentId: attendee.studentId, date: { gte: dayStart, lt: dayEnd } },
      })
      if (existing) {
        await prisma.coachSession.update({
          where: { id: existing.id },
          data: { topicsCovered: attendee.topic ?? topic, duration: groupClass.duration },
        })
      } else {
        await prisma.coachSession.create({
          data: {
            studentId: attendee.studentId,
            date: sessionDate,
            duration: groupClass.duration,
            topicsCovered: attendee.topic ?? topic,
          },
        })
      }
    }
  }

  // Compute per-student session counts this month for WhatsApp message
  const { monthStart, nextMonth } = monthBounds(sessionDate)
  const counts: Record<string, number> = {}
  for (const att of presentStudents) {
    const count = await prisma.coachSession.count({
      where: { studentId: att.studentId, date: { gte: monthStart, lt: nextMonth } },
    })
    counts[att.studentId] = count
  }

  return NextResponse.json({ updated, sessionCounts: counts })
}
