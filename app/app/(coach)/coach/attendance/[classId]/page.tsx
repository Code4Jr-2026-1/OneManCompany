import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { AttendanceForm } from "./attendance-form"

export default async function AttendancePage({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string }>
  searchParams: Promise<{ type?: string }>
}) {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH") redirect("/login")

  const coach = await prisma.user.findUnique({ where: { email: session.user!.email! } })
  if (!coach) redirect("/login")

  const { classId } = await params
  const { type } = await searchParams
  const classType = type === "group" ? "group" : "private"

  if (classType === "private") {
    const scheduledSession = await prisma.scheduledSession.findFirst({
      where: { id: classId, student: { coachId: coach.id } },
      include: { student: { select: { id: true, name: true, skillLevel: true, phone: true } } },
    })
    if (!scheduledSession) notFound()

    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="mb-6">
          <a href="/coach" className="text-sm text-muted-foreground hover:text-foreground">← Back to Today</a>
          <h1 className="text-2xl font-bold text-foreground mt-2">Mark Attendance</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Private session · {scheduledSession.student.name} · {scheduledSession.duration} min
          </p>
        </div>

        <AttendanceForm
          classType="private"
          classId={classId}
          date={new Date().toISOString()}
          students={[{
            id: scheduledSession.student.id,
            name: scheduledSession.student.name,
            phone: scheduledSession.student.phone,
          }]}
        />
      </div>
    )
  }

  // Group class
  const groupClass = await prisma.groupClass.findFirst({
    where: { id: classId, coachId: coach.id },
    include: {
      enrollments: {
        where: { status: "ACTIVE" },
        include: { student: { select: { id: true, name: true, phone: true } } },
      },
    },
  })
  if (!groupClass) notFound()

  const students = groupClass.enrollments.map(e => ({
    id: e.student.id,
    name: e.student.name,
    phone: e.student.phone,
  }))

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6">
        <a href="/coach" className="text-sm text-muted-foreground hover:text-foreground">← Back to Today</a>
        <h1 className="text-2xl font-bold text-foreground mt-2">Mark Attendance</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {groupClass.name} · Group class · {groupClass.duration} min · {students.length} students
        </p>
      </div>

      <AttendanceForm
        classType="group"
        classId={classId}
        date={new Date().toISOString()}
        students={students}
      />
    </div>
  )
}
