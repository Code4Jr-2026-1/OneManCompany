import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { TriangleAlert, ArrowRight, Users, CalendarCheck, BookOpen } from "lucide-react"

export default async function CoachHome() {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH") redirect("/login")

  const coach = await prisma.user.findUnique({ where: { email: session.user!.email! } })
  if (!coach) redirect("/login")

  const now = new Date()
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
  const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999)
  const weekEnd    = new Date(now.getTime() + 7 * 86400000)

  const students = await prisma.student.findMany({
    where: { coachId: coach.id },
    include: {
      coachSessions: { orderBy: { date: "desc" }, take: 1 },
      scheduledSessions: { where: { scheduledAt: { gte: now, lte: weekEnd } }, orderBy: { scheduledAt: "asc" }, take: 1 },
      homeworkAssignments: { where: { status: "PENDING" }, orderBy: { dueDate: "asc" }, take: 1 },
      snapshots: { orderBy: { month: "desc" }, take: 2 },
    },
    orderBy: { updatedAt: "desc" },
  })

  const groupClasses = await prisma.groupClass.findMany({
    where: { coachId: coach.id, isActive: true },
    include: { enrollments: { where: { status: "ACTIVE" }, select: { id: true } } },
  })

  const todayDow = now.getDay()
  const todayGroupClasses = groupClasses.filter(gc => gc.dayOfWeek === todayDow)

  const todaySessions = students
    .map(s => s.scheduledSessions.find(ss => new Date(ss.scheduledAt) >= todayStart && new Date(ss.scheduledAt) <= todayEnd))
    .filter(Boolean)

  const upcomingPrivate = students
    .flatMap(s => s.scheduledSessions.map(ss => ({ ...ss, student: s })))
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 3)

  const upcomingSessions = students
    .flatMap(s => s.scheduledSessions.map(ss => ({ ...ss, student: s })))
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 5)

  const needsAttention = students.filter(s => {
    const lastSession = s.coachSessions[0]
    if (!lastSession) return true
    const daysSince = Math.floor((now.getTime() - new Date(lastSession.date).getTime()) / 86400000)
    return daysSince >= 7
  })

  const totalPendingHomework = students.reduce((a, s) => a + s.homeworkAssignments.length, 0)

  const fmt = (d: Date) => new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })
  const fmtTime = (d: Date) => new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8 space-y-6">
        {/* Greeting */}
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening"}, {coach.name?.split(" ")[0]} ♟
          </h1>
          <p className="text-sm text-muted-foreground">
            {fmt(now)} · {students.length} students · {totalPendingHomework} homework pending
          </p>
        </header>

        {/* Alert strip */}
        {needsAttention.length > 0 && (
          <div role="alert" className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <TriangleAlert className="size-[18px]" aria-hidden="true" />
              </span>
              <p className="text-sm text-amber-900">
                <span className="font-semibold">{needsAttention.map(s => s.name.split(" ")[0]).join(", ")}</span> — no session in 7+ days. Consider scheduling a catch-up.
              </p>
            </div>
            <Link href="/coach/students" className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700 sm:self-center">
              Review
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* LEFT: Today + Upcoming */}
          <div className="lg:col-span-2 space-y-6">

            {/* Today's sessions */}
            <div className="bg-card border border-border rounded-xl shadow-sm">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h2 className="font-semibold text-card-foreground">Today&apos;s Sessions</h2>
                <Link href="/coach/schedule" className="text-sm text-primary hover:underline">View calendar →</Link>
              </div>
              {todaySessions.length === 0 && todayGroupClasses.length === 0 ? (
                <div className="px-6 py-8 text-center text-muted-foreground text-sm">
                  No sessions scheduled today.
                  <Link href="/coach/personal-classes" className="text-primary hover:underline ml-1">Book one →</Link>
                </div>
              ) : (
                <div className="divide-y">
                  {todayGroupClasses.map(gc => (
                    <div key={gc.id} className="px-6 py-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm flex-shrink-0">👥</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{gc.name}</p>
                          <span className="text-xs bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full">Group</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{gc.startTime} · {gc.duration} min · {gc.enrollments.length} students</p>
                      </div>
                      <Link href={`/coach/group-classes/${gc.id}`}>
                        <button className="text-sm bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700">View →</button>
                      </Link>
                    </div>
                  ))}
                  {todaySessions.map((ss, i) => {
                    const student = students.find(s => s.scheduledSessions.some(x => x.id === ss!.id))!
                    return (
                      <div key={i} className="px-6 py-4 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                          {student.name.split(" ").map(n => n[0]).join("").slice(0,2)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">{student.name}</p>
                            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">Private</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{fmtTime(new Date(ss!.scheduledAt))} · {ss!.duration} min · {student.skillLevel}</p>
                        </div>
                        <div className="flex gap-2">
                          <Link href={`/coach/students/${student.id}/brief`}>
                            <button className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">📋 Brief</button>
                          </Link>
                          <Link href={`/coach/students/${student.id}/end-session`}>
                            <button className="text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700">✓ End</button>
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Next 3 private sessions widget */}
            {upcomingPrivate.length > 0 && (
              <div className="bg-card border border-border rounded-xl shadow-sm">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                  <h2 className="font-semibold text-foreground">Next Private Sessions</h2>
                  <Link href="/coach/personal-classes" className="text-sm text-primary hover:underline">All →</Link>
                </div>
                <div className="divide-y">
                  {upcomingPrivate.map(ss => (
                    <div key={ss.id} className="px-6 py-3 flex items-center gap-3">
                      <div className="w-20 text-xs text-muted-foreground flex-shrink-0">
                        <div>{fmt(new Date(ss.scheduledAt))}</div>
                        <div className="font-medium text-muted-foreground">{fmtTime(new Date(ss.scheduledAt))}</div>
                      </div>
                      <div className="flex-1 text-sm font-medium text-foreground">{ss.student.name}</div>
                      <Link href={`/coach/students/${ss.student.id}/brief`}>
                        <button className="text-xs text-primary hover:underline">Brief →</button>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming this week */}
            <div className="bg-card border border-border rounded-xl shadow-sm">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="font-semibold text-foreground">Upcoming Sessions (7 days)</h2>
              </div>
              {upcomingSessions.length === 0 ? (
                <div className="px-6 py-6 text-sm text-muted-foreground text-center">No sessions scheduled this week.</div>
              ) : (
                <div className="divide-y">
                  {upcomingSessions.map((ss) => {
                    const hwPending = ss.student.homeworkAssignments.length > 0
                    return (
                      <div key={ss.id} className="px-6 py-3 flex items-center gap-4">
                        <div className="w-24 text-xs text-muted-foreground font-medium">{fmt(new Date(ss.scheduledAt))}</div>
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground text-xs font-bold">
                          {ss.student.name.split(" ").map(n => n[0]).join("").slice(0,2)}
                        </div>
                        <div className="flex-1 text-sm font-medium text-foreground">{ss.student.name}</div>
                        {hwPending && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">HW pending</span>}
                        <div className="flex gap-2">
                          <Link href={`/coach/students/${ss.student.id}/brief`}>
                            <button className="text-xs text-primary hover:underline">Brief</button>
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Stats + Homework */}
          <div className="space-y-4">
            {/* Quick stats */}
            <div className="bg-card border border-border rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-foreground mb-4">This Month</h3>
              <div className="space-y-3">
                {[
                  { label: "Students", value: students.length },
                  { label: "Sessions done", value: students.reduce((a, s) => a + (s.snapshots[0]?.sessionCount ?? 0), 0) },
                  { label: "Homework pending", value: totalPendingHomework, warn: totalPendingHomework > 0 },
                  { label: "Needs attention", value: needsAttention.length, warn: needsAttention.length > 0 },
                ].map(stat => (
                  <div key={stat.label} className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{stat.label}</span>
                    <span className={`font-bold text-lg ${stat.warn ? "text-amber-600" : "text-foreground"}`}>{stat.value}</span>
                  </div>
                ))}
              </div>
              <Link href="/coach/billing">
                <button className="w-full mt-4 text-sm text-primary border border-primary/30 hover:bg-accent rounded-lg py-2">View Billing →</button>
              </Link>
            </div>

            {/* Homework check */}
            <div className="bg-card border border-border rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-foreground mb-4">Homework Status</h3>
              <div className="space-y-3">
                {students.map(s => {
                  const hw = s.homeworkAssignments[0]
                  return (
                    <div key={s.id} className="flex items-center justify-between">
                      <span className="text-sm text-foreground">{s.name.split(" ")[0]}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        !hw ? "bg-secondary text-muted-foreground" :
                        hw.status === "DONE" ? "bg-green-100 text-green-700" :
                        "bg-orange-100 text-orange-700"
                      }`}>
                        {!hw ? "None" : hw.status === "DONE" ? "✓ Done" : "Pending"}
                      </span>
                    </div>
                  )
                })}
              </div>
              <Link href="/coach/homework">
                <button className="w-full mt-4 text-sm text-muted-foreground border border-border hover:bg-accent rounded-lg py-2">Manage Homework →</button>
              </Link>
            </div>
          </div>
        </div>
    </div>
  )
}
