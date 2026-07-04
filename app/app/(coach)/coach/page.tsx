import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { TriangleAlert, ArrowRight, Users, CalendarCheck, BookOpen, TrendingUp, TrendingDown } from "lucide-react"
import { monthBounds, privateAmount, groupAmount } from "@/lib/billing"

export default async function CoachHome() {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH") redirect("/login")

  const coach = await prisma.user.findUnique({ where: { email: session.user!.email! } })
  if (!coach) redirect("/login")

  const now = new Date()
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
  const todayEnd   = new Date(todayStart.getTime() + 86400000)
  const weekEnd    = new Date(now.getTime() + 7 * 86400000)
  const { monthStart, nextMonth } = monthBounds(now)
  const hourlyRate = coach.hourlyRate ?? 500

  const students = await prisma.student.findMany({
    where: { coachId: coach.id },
    include: {
      coachSessions: { orderBy: { date: "desc" }, take: 1 },
      scheduledSessions: { where: { scheduledAt: { gte: todayStart, lte: weekEnd } }, orderBy: { scheduledAt: "asc" } },
      homeworkAssignments: { orderBy: { dueDate: "asc" } },
      snapshots: { orderBy: { month: "desc" }, take: 2 },
      billingEntries: { where: { month: monthStart } },
    },
    orderBy: { updatedAt: "desc" },
  })

  const groupClasses = await prisma.groupClass.findMany({
    where: { coachId: coach.id, isActive: true },
    include: {
      enrollments: { where: { status: "ACTIVE" }, include: { student: { select: { id: true, name: true } } } },
      sessions: { where: { date: { gte: monthStart, lt: nextMonth } }, select: { id: true } },
    },
  })

  // Today's private sessions
  const todayPrivate = students.flatMap(s =>
    s.scheduledSessions
      .filter(ss => new Date(ss.scheduledAt) >= todayStart && new Date(ss.scheduledAt) < todayEnd)
      .map(ss => ({ ...ss, studentId: s.id, studentName: s.name, skillLevel: s.skillLevel }))
  ).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())

  // Today's group classes
  const todayDow = now.getDay()
  const todayGroups = groupClasses.filter(gc => gc.dayOfWeek === todayDow)

  const hasClassesToday = todayPrivate.length > 0 || todayGroups.length > 0

  // Weekly upcoming (excluding today for secondary section)
  const needsAttention = students.filter(s => {
    const lastSession = s.coachSessions[0]
    if (!lastSession) return true
    const daysSince = Math.floor((now.getTime() - new Date(lastSession.date).getTime()) / 86400000)
    return daysSince >= 7
  })

  const homeworkPending = students.reduce((a, s) => a + s.homeworkAssignments.filter(h => h.status === "PENDING").length, 0)
  const homeworkDone = students.reduce((a, s) => a + s.homeworkAssignments.filter(h => h.status === "DONE").length, 0)

  const sessionAgg = await prisma.coachSession.groupBy({
    by: ["studentId"],
    where: { studentId: { in: students.map(s => s.id) }, date: { gte: monthStart, lt: nextMonth } },
    _sum: { duration: true },
  })
  const hoursMap = new Map(sessionAgg.map(a => [a.studentId, (a._sum.duration ?? 0) / 60]))

  let billedThisMonth = 0
  let collectedThisMonth = 0
  for (const s of students) {
    const hours = hoursMap.get(s.id) ?? 0
    const amount = privateAmount(hours, hourlyRate)
    const entry = s.billingEntries.find(e => !e.groupClassId)
    billedThisMonth += amount
    if (entry?.paid) collectedThisMonth += amount
  }
  for (const gc of groupClasses) {
    const amount = groupAmount(gc.sessions.length, gc.groupRate)
    for (const e of gc.enrollments) {
      const student = students.find(s => s.id === e.student.id)
      const entry = student?.billingEntries.find(b => b.groupClassId === gc.id)
      billedThisMonth += amount
      if (entry?.paid) collectedThisMonth += amount
    }
  }
  const pendingThisMonth = billedThisMonth - collectedThisMonth

  // Upcoming (next 7 days excluding today) for secondary section
  function atTime(date: Date, time: string) {
    const [h, m] = time.split(":").map(Number)
    const d = new Date(date); d.setHours(h, m, 0, 0); return d
  }
  type UpcomingItem =
    | { kind: "private"; date: Date; studentId: string; studentName: string; skillLevel: string; duration: number }
    | { kind: "group"; date: Date; id: string; name: string; duration: number; enrolledCount: number; startTime: string }

  const upcomingItems: UpcomingItem[] = []
  for (const s of students) {
    for (const ss of s.scheduledSessions) {
      const d = new Date(ss.scheduledAt)
      if (d >= todayEnd) upcomingItems.push({ kind: "private", date: d, studentId: s.id, studentName: s.name, skillLevel: s.skillLevel, duration: ss.duration })
    }
  }
  for (let offset = 1; offset <= 6; offset++) {
    const day = new Date(todayStart.getTime() + offset * 86400000)
    const dow = day.getDay()
    for (const gc of groupClasses) {
      if (gc.dayOfWeek === dow) {
        upcomingItems.push({ kind: "group", date: atTime(day, gc.startTime), id: gc.id, name: gc.name, duration: gc.duration, enrolledCount: gc.enrollments.length, startTime: gc.startTime })
      }
    }
  }
  upcomingItems.sort((a, b) => a.date.getTime() - b.date.getTime())
  const upcoming = upcomingItems.slice(0, 6)

  const sessionsThisWeek = todayPrivate.length + todayGroups.length + upcomingItems.length
  const lastMonthSessions = students.reduce((a, s) => a + (s.snapshots[1]?.sessionCount ?? 0), 0)
  const thisMonthSessions = students.reduce((a, s) => a + (s.snapshots[0]?.sessionCount ?? 0), 0)
  const sessionsTrend = thisMonthSessions - lastMonthSessions

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
          {fmt(now)} · {students.length} students · {homeworkPending} homework pending
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
              <span className="font-semibold">{needsAttention.map(s => s.name.split(" ")[0]).join(", ")}</span> — no session in 7+ days.
            </p>
          </div>
          <Link href="/coach/students" className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700 sm:self-center">
            Review <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      )}

      {/* ── TODAY'S CLASSES (primary) ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-foreground text-lg">Today&apos;s Classes</h2>
          <Link href="/coach/schedule" className="text-sm text-primary hover:underline">Full schedule →</Link>
        </div>

        {!hasClassesToday ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <p className="text-muted-foreground text-sm">No classes scheduled today.</p>
            <Link href="/coach/personal-classes" className="text-primary text-sm hover:underline mt-2 inline-block">Schedule a session →</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Private sessions today */}
            {todayPrivate.map(ss => (
              <div key={ss.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                  {ss.studentName.split(" ").map(n => n[0]).join("").slice(0,2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-foreground">{ss.studentName}</p>
                    <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">Private</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{fmtTime(new Date(ss.scheduledAt))} · {ss.duration} min · {ss.skillLevel}</p>
                </div>
                <Link href={`/coach/attendance/${ss.id}?type=private&studentId=${ss.studentId}`}>
                  <button className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 shrink-0">
                    Mark Done ✓
                  </button>
                </Link>
              </div>
            ))}

            {/* Group classes today */}
            {todayGroups.map(gc => (
              <div key={gc.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700 text-lg shrink-0">👥</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-foreground">{gc.name}</p>
                    <span className="text-xs bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full">Group</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{gc.startTime} · {gc.duration} min · {gc.enrollments.length} students</p>
                </div>
                <Link href={`/coach/attendance/${gc.id}?type=group`}>
                  <button className="bg-teal-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-teal-700 shrink-0">
                    Mark Done ✓
                  </button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── SECONDARY: Upcoming + Analytics ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Upcoming sessions this week */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-card-foreground">This Week</h2>
              <Link href="/coach/schedule" className="text-sm text-primary hover:underline">View calendar →</Link>
            </div>
            {upcoming.length === 0 ? (
              <div className="px-6 py-8 text-center text-muted-foreground text-sm">
                No more sessions this week.
                <Link href="/coach/personal-classes" className="text-primary hover:underline ml-1">Book one →</Link>
              </div>
            ) : (
              <div className="divide-y">
                {upcoming.map((item, i) => {
                  if (item.kind === "group") {
                    return (
                      <div key={`g-${item.id}-${i}`} className="px-6 py-4 flex items-center gap-4">
                        <div className="w-20 text-xs text-muted-foreground flex-shrink-0">
                          <div>{fmt(item.date)}</div>
                          <div className="font-medium">{item.startTime}</div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm flex-shrink-0">👥</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">{item.name}</p>
                            <span className="text-xs bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded-full">Group</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{item.duration} min · {item.enrolledCount} students</p>
                        </div>
                        <Link href={`/coach/group-classes/${item.id}`}>
                          <button className="text-sm bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700">View →</button>
                        </Link>
                      </div>
                    )
                  }
                  return (
                    <div key={`p-${item.studentId}-${i}`} className="px-6 py-4 flex items-center gap-4">
                      <div className="w-20 text-xs text-muted-foreground flex-shrink-0">
                        <div>{fmt(item.date)}</div>
                        <div className="font-medium">{fmtTime(item.date)}</div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                        {item.studentName.split(" ").map(n => n[0]).join("").slice(0,2)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{item.studentName}</p>
                          <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">Private</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.duration} min · {item.skillLevel}</p>
                      </div>
                      <Link href={`/coach/students/${item.studentId}`}>
                        <button className="text-xs text-primary hover:underline">Profile →</button>
                      </Link>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Billing + Overview + Homework */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-foreground mb-4">Billing — {monthStart.toLocaleDateString("en-IN", { month: "long" })}</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Billed</span>
                <span className="font-bold text-lg text-foreground">₹{billedThisMonth.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Collected</span>
                <span className="font-bold text-lg text-green-600">₹{collectedThisMonth.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pending</span>
                <span className={`font-bold text-lg ${pendingThisMonth > 0 ? "text-amber-600" : "text-green-600"}`}>₹{pendingThisMonth.toLocaleString()}</span>
              </div>
            </div>
            <Link href="/coach/billing">
              <button className="w-full mt-4 text-sm text-primary border border-primary/30 hover:bg-accent rounded-lg py-2">View Billing →</button>
            </Link>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-foreground mb-4">Overview</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/coach/students" className="rounded-lg border border-border p-3 hover:bg-accent transition-colors">
                <Users className="size-4 text-blue-600 mb-1.5" />
                <p className="text-lg font-bold text-foreground">{students.length}</p>
                <p className="text-xs text-muted-foreground">Students</p>
              </Link>
              <Link href="/coach/schedule" className="rounded-lg border border-border p-3 hover:bg-accent transition-colors">
                <CalendarCheck className="size-4 text-blue-600 mb-1.5" />
                <p className="text-lg font-bold text-foreground">{sessionsThisWeek}</p>
                <p className="text-xs text-muted-foreground">This week</p>
                {sessionsTrend !== 0 && (
                  <p className={`text-xs flex items-center gap-0.5 mt-0.5 ${sessionsTrend > 0 ? "text-green-600" : "text-amber-600"}`}>
                    {sessionsTrend > 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                    {Math.abs(sessionsTrend)} vs last
                  </p>
                )}
              </Link>
              <Link href="/coach/students" className={`rounded-lg border p-3 transition-colors ${needsAttention.length > 0 ? "border-amber-200 bg-amber-50 hover:bg-amber-100" : "border-border hover:bg-accent"}`}>
                <TriangleAlert className={`size-4 mb-1.5 ${needsAttention.length > 0 ? "text-amber-600" : "text-muted-foreground"}`} />
                <p className={`text-lg font-bold ${needsAttention.length > 0 ? "text-amber-700" : "text-foreground"}`}>{needsAttention.length}</p>
                <p className="text-xs text-muted-foreground">Attention</p>
              </Link>
              <Link href="/coach/homework" className={`rounded-lg border p-3 transition-colors ${homeworkPending > 0 ? "border-amber-200 bg-amber-50 hover:bg-amber-100" : "border-border hover:bg-accent"}`}>
                <BookOpen className={`size-4 mb-1.5 ${homeworkPending > 0 ? "text-amber-600" : "text-muted-foreground"}`} />
                <p className={`text-lg font-bold ${homeworkPending > 0 ? "text-amber-700" : "text-foreground"}`}>{homeworkPending}</p>
                <p className="text-xs text-muted-foreground">HW pending</p>
              </Link>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-foreground mb-4">Homework</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pending</span>
                <span className={`font-bold text-lg ${homeworkPending > 0 ? "text-amber-600" : "text-foreground"}`}>{homeworkPending}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Completed</span>
                <span className="font-bold text-lg text-green-600">{homeworkDone}</span>
              </div>
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
