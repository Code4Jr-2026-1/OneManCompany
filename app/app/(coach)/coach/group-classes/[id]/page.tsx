import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { CoachNav } from "@/components/coach-nav"
import { GroupClassActions, EnrollButton, DropButton, LogSessionButton } from "./actions"

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export default async function GroupClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH") redirect("/login")

  const coach = await prisma.user.findUnique({ where: { email: session.user!.email! } })
  if (!coach) redirect("/login")

  const groupClass = await prisma.groupClass.findFirst({
    where: { id, coachId: coach.id },
    include: {
      enrollments: {
        include: { student: { select: { id: true, name: true, skillLevel: true } } },
        orderBy: { enrolledAt: "asc" },
      },
      sessions: { orderBy: { date: "desc" }, take: 20 },
    },
  })
  if (!groupClass || !groupClass.isActive) notFound()

  const allStudents = await prisma.student.findMany({
    where: { coachId: coach.id },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  const activeEnrollments = groupClass.enrollments.filter(e => e.status === "ACTIVE")
  const waitlisted = groupClass.enrollments.filter(e => e.status === "WAITLISTED")
  const enrolledIds = new Set(groupClass.enrollments.filter(e => e.status !== "DROPPED").map(e => e.studentId))
  const availableStudents = allStudents.filter(s => !enrolledIds.has(s.id))

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const sessionsThisMonth = groupClass.sessions.filter(s => new Date(s.date) >= monthStart && new Date(s.date) < monthEnd).length

  return (
    <div className="min-h-screen bg-gray-50">
      <CoachNav coachName={coach.name ?? "Coach"} />
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex items-start gap-4">
          <Link href="/coach/group-classes" className="text-gray-400 hover:text-gray-600 mt-1 text-sm">← Classes</Link>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{groupClass.name}</h1>
              <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full capitalize">{groupClass.skillLevel}</span>
            </div>
            <p className="text-gray-500 text-sm mt-1">
              Every {DAYS[groupClass.dayOfWeek]} at {groupClass.startTime} · {groupClass.duration} min · ₹{groupClass.groupRate}/student/session
            </p>
          </div>
          <GroupClassActions
            classId={id}
            className={groupClass.name}
            currentCapacity={groupClass.capacity}
            currentName={groupClass.name}
            currentDescription={groupClass.description ?? ""}
            currentSkillLevel={groupClass.skillLevel}
            currentDayOfWeek={groupClass.dayOfWeek}
            currentStartTime={groupClass.startTime}
            currentDuration={groupClass.duration}
            currentGroupRate={groupClass.groupRate}
          />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Enrolled", value: `${activeEnrollments.length} / ${groupClass.capacity}`, color: "teal" },
            { label: "Waitlisted", value: waitlisted.length, color: "amber" },
            { label: "Total Sessions", value: groupClass.sessions.length, color: "blue" },
            { label: "This Month", value: sessionsThisMonth, color: "green" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border p-4">
              <p className="text-xs text-gray-400 mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color === "teal" ? "text-teal-700" : s.color === "amber" ? "text-amber-600" : s.color === "blue" ? "text-blue-600" : "text-green-600"}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* LEFT: Roster */}
          <div className="col-span-2 space-y-6">
            <div className="bg-white rounded-xl border">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Roster</h2>
                <EnrollButton classId={id} students={availableStudents} />
              </div>
              {groupClass.enrollments.filter(e => e.status !== "DROPPED").length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-400 text-sm">No students enrolled yet.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 font-semibold uppercase border-b">
                      <th className="px-6 py-2 text-left">Student</th>
                      <th className="px-6 py-2 text-left">Level</th>
                      <th className="px-6 py-2 text-left">Status</th>
                      <th className="px-6 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {groupClass.enrollments.filter(e => e.status !== "DROPPED").map((e, idx) => (
                      <tr key={e.id} className="hover:bg-gray-50">
                        <td className="px-6 py-3 font-medium text-gray-900">
                          <Link href={`/coach/students/${e.student.id}`} className="hover:text-teal-600">{e.student.name}</Link>
                        </td>
                        <td className="px-6 py-3 text-gray-500 capitalize">{e.student.skillLevel}</td>
                        <td className="px-6 py-3">
                          {e.status === "ACTIVE" ? (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>
                          ) : (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                              Waitlist #{waitlisted.findIndex(w => w.id === e.id) + 1}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <DropButton classId={id} studentId={e.studentId} studentName={e.student.name} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Session history */}
            <div className="bg-white rounded-xl border">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Session History</h2>
                <LogSessionButton classId={id} />
              </div>
              {groupClass.sessions.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-400 text-sm">No sessions logged yet.</div>
              ) : (
                <div className="divide-y">
                  {groupClass.sessions.map(s => (
                    <div key={s.id} className="px-6 py-4">
                      <div className="flex items-start justify-between mb-1">
                        <span className="font-medium text-gray-900 text-sm">
                          {new Date(s.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                        </span>
                      </div>
                      {s.topicsCovered && <p className="text-sm text-gray-600 mb-1">Topics: {s.topicsCovered}</p>}
                      {s.aiSummary && (
                        <details className="mt-1">
                          <summary className="text-xs text-teal-600 cursor-pointer">AI Summary</summary>
                          <p className="text-sm text-gray-600 mt-1 pl-3 border-l-2 border-teal-200">{s.aiSummary}</p>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Quick info */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Class Info</h3>
              <div className="space-y-2 text-sm">
                {[
                  { label: "Day", value: DAYS[groupClass.dayOfWeek] },
                  { label: "Time", value: groupClass.startTime },
                  { label: "Duration", value: `${groupClass.duration} min` },
                  { label: "Capacity", value: `${groupClass.capacity} students` },
                  { label: "Rate", value: `₹${groupClass.groupRate}/session` },
                ].map(r => (
                  <div key={r.label} className="flex justify-between">
                    <span className="text-gray-400">{r.label}</span>
                    <span className="font-medium text-gray-900">{r.value}</span>
                  </div>
                ))}
              </div>
              {groupClass.description && (
                <p className="mt-3 text-sm text-gray-500 border-t pt-3">{groupClass.description}</p>
              )}
            </div>

            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold text-gray-900 mb-2">This Month&apos;s Revenue</h3>
              <p className="text-2xl font-bold text-teal-700">
                ₹{(sessionsThisMonth * groupClass.groupRate * activeEnrollments.length).toLocaleString()}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {sessionsThisMonth} session{sessionsThisMonth !== 1 ? "s" : ""} × {activeEnrollments.length} students × ₹{groupClass.groupRate}
              </p>
              <Link href="/coach/billing">
                <button className="w-full mt-3 text-sm text-teal-600 border border-teal-200 hover:bg-teal-50 rounded-lg py-1.5">
                  View Billing →
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
