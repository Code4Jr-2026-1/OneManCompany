import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { CoachNav } from "@/components/coach-nav"
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
    },
  })

  const events = students.flatMap(s =>
    s.scheduledSessions.map(ss => ({
      id: ss.id,
      studentId: s.id,
      studentName: s.name,
      scheduledAt: ss.scheduledAt.toISOString(),
      duration: ss.duration,
      status: ss.status,
    }))
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <CoachNav coachName={coach.name ?? "Coach"} />
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Session Schedule</h1>
            <p className="text-gray-500 text-sm mt-1">{events.length} sessions scheduled</p>
          </div>
          <AddSessionButton students={students.map(s => ({ id: s.id, name: s.name }))} />
        </div>
        <WeekCalendar events={events} />
      </div>
    </div>
  )
}
