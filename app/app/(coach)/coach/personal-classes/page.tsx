import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { QuickBookButton, QuickBookInline, LogSessionButton, AdHocLogButton } from "./actions"
import { ClassesTabs } from "@/components/classes-tabs"

function fmt(d: Date | string) {
  return new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })
}
function fmtTime(d: Date | string) {
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
}

export default async function PersonalClassesPage() {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH") redirect("/login")

  const coach = await prisma.user.findUnique({ where: { email: session.user!.email! } })
  if (!coach) redirect("/login")

  const now = new Date()

  const studentRows = await prisma.student.findMany({
    where: { coachId: coach.id },
    select: {
      id: true, name: true, skillLevel: true, phone: true,
      user: { select: { email: true } },
      parent: { select: { email: true } },
    },
    orderBy: { name: "asc" },
  })
  const students = studentRows.map(s => ({
    id: s.id,
    name: s.name,
    skillLevel: s.skillLevel,
    phone: s.phone,
    emails: [s.user?.email, s.parent?.email].filter((e): e is string => !!e),
  }))
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

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-1">Classes</h1>
          <p className="text-muted-foreground text-sm mb-4">Manage your private and group sessions</p>
          <ClassesTabs active="personal" />
        </div>

        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground text-sm">1-on-1 private sessions with your students</p>
          <QuickBookButton students={students} />
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            {/* Upcoming */}
            <div className="bg-card border border-border rounded-xl shadow-sm">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h2 className="font-semibold text-foreground">Upcoming Sessions</h2>
                <span className="text-xs text-muted-foreground">{upcoming.length} scheduled</span>
              </div>
              {upcoming.length === 0 ? (
                <div className="px-6 py-10 text-center text-muted-foreground text-sm">
                  No upcoming sessions.{" "}
                  <QuickBookInline students={students} />
                </div>
              ) : (
                <div className="divide-y">
                  {upcoming.map(ss => (
                    <div key={ss.id} className="px-6 py-4 flex items-center gap-4">
                      <div className="w-16 text-center flex-shrink-0">
                        <p className="text-xs text-muted-foreground">{fmt(ss.scheduledAt)}</p>
                        <p className="text-sm font-semibold text-foreground">{fmtTime(ss.scheduledAt)}</p>
                      </div>
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs flex-shrink-0">
                        {ss.student.name.split(" ").map(n => n[0]).join("").slice(0,2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">{ss.student.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{ss.student.skillLevel} · {ss.duration} min</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Link href={`/coach/students/${ss.student.id}`}>
                          <button className="text-xs bg-blue-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-blue-700">Profile</button>
                        </Link>
                        <LogSessionButton
                          sessionId={ss.id}
                          studentName={ss.student.name}
                          defaultDuration={ss.duration}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent */}
            <div className="bg-card border border-border rounded-xl shadow-sm">
              <div className="px-6 py-4 border-b">
                <h2 className="font-semibold text-foreground">Recent Sessions</h2>
              </div>
              {recent.length === 0 ? (
                <div className="px-6 py-8 text-center text-muted-foreground text-sm">No sessions logged yet.</div>
              ) : (
                <div className="divide-y">
                  {recent.map(s => (
                    <div key={s.id} className="px-6 py-4 flex items-center gap-4">
                      <div className="w-24 text-xs text-muted-foreground flex-shrink-0">{fmt(s.date)}</div>
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground text-xs font-bold flex-shrink-0">
                        {s.student.name.split(" ").map(n => n[0]).join("").slice(0,2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm">{s.student.name}</p>
                        {s.topicsCovered && <p className="text-xs text-muted-foreground truncate">{s.topicsCovered}</p>}
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">{s.duration} min</span>
                      <Link href={`/coach/students/${s.student.id}`} className="text-xs text-blue-600 hover:underline flex-shrink-0">View →</Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: quick stats + log ad-hoc */}
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-foreground mb-4">Summary</h3>
              <div className="space-y-3 text-sm">
                {[
                  { label: "Students", value: students.length },
                  { label: "Upcoming", value: upcoming.length },
                  { label: "Sessions (recent 10)", value: recent.length },
                ].map(r => (
                  <div key={r.label} className="flex justify-between">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className="font-bold text-foreground">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-foreground mb-3">Log Ad-hoc Session</h3>
              <p className="text-xs text-muted-foreground mb-3">Log a session that wasn&apos;t scheduled in advance.</p>
              <AdHocLogButton students={students} />
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-foreground mb-2">Billing</h3>
              <p className="text-xs text-muted-foreground mb-3">View private lesson payments and invoices.</p>
              <Link href="/coach/billing">
                <button className="w-full text-sm text-blue-600 border border-blue-200 hover:bg-blue-50 rounded-lg py-2">View Private Billing →</button>
              </Link>
            </div>
          </div>
        </div>
    </div>
  )
}
