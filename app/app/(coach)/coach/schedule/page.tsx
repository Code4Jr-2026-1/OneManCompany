import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { WeekCalendar, AddSessionButton } from "./calendar"

export default async function SchedulePage() {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH") redirect("/login")
  const coach = await prisma.user.findUnique({ where: { email: session.user!.email! } })
  if (!coach) redirect("/login")

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 2, 0)

  const students = await prisma.student.findMany({
    where: { coachId: coach.id },
    include: {
      scheduledSessions: {
        where: { scheduledAt: { gte: monthStart, lte: monthEnd } },
        orderBy: { scheduledAt: "asc" },
      },
      user: { select: { email: true } },
      parent: { select: { email: true } },
    },
  })

  const groupClasses = await prisma.groupClass.findMany({
    where: { coachId: coach.id, isActive: true },
    include: {
      enrollments: {
        where: { status: "ACTIVE" },
        include: { student: { include: { user: { select: { email: true } }, parent: { select: { email: true } } } } },
      },
    },
  })

  const defaultLink = (coach as { defaultMeetingLink?: string | null }).defaultMeetingLink ?? null

  const privateEvents = students.flatMap(s =>
    s.scheduledSessions.map(ss => ({
      id: ss.id,
      studentId: s.id,
      studentName: s.name,
      studentPhone: s.phone,
      studentEmails: [s.user?.email, s.parent?.email].filter((e): e is string => !!e),
      scheduledAt: ss.scheduledAt.toISOString(),
      duration: ss.duration,
      status: ss.status,
      meetingLink: ss.meetingLink ?? defaultLink,
      type: "private" as const,
    }))
  )

  const groupEvents = groupClasses.map(gc => ({
    id: gc.id,
    name: gc.name,
    dayOfWeek: gc.dayOfWeek,
    startTime: gc.startTime,
    duration: gc.duration,
    enrolledCount: gc.enrollments.length,
    capacity: gc.capacity,
    meetingLink: gc.meetingLink ?? defaultLink,
    whatsappGroupLink: gc.whatsappGroupLink,
    enrolledEmails: Array.from(new Set(
      gc.enrollments.flatMap(e => [e.student.user?.email, e.student.parent?.email].filter((em): em is string => !!em))
    )),
    type: "group" as const,
  }))

  const studentContacts = students.map(s => ({
    id: s.id,
    name: s.name,
    phone: s.phone,
    emails: [s.user?.email, s.parent?.email].filter((e): e is string => !!e),
  }))

  const groupContacts = groupEvents.map(gc => ({
    id: gc.id,
    name: gc.name,
    startTime: gc.startTime,
    duration: gc.duration,
    meetingLink: gc.meetingLink,
    whatsappGroupLink: gc.whatsappGroupLink,
    enrolledEmails: gc.enrolledEmails,
  }))

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Session Schedule</h1>
          <p className="text-muted-foreground text-sm mt-1">{privateEvents.length} private sessions · {groupClasses.length} group class{groupClasses.length !== 1 ? "es" : ""}</p>
        </div>
        <AddSessionButton students={studentContacts} groupClasses={groupContacts} />
      </div>
      <WeekCalendar privateEvents={privateEvents} groupEvents={groupEvents} />
    </div>
  )
}
