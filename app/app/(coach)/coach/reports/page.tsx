import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { GenerateAllButton, GenerateOneButton, WriteManuallyButton, DraftCard, QuickEditButton } from "./actions"

export default async function ReportsPage() {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH") redirect("/login")
  const coach = await prisma.user.findUnique({ where: { email: session.user!.email! } })
  if (!coach) redirect("/login")

  const currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

  const students = await prisma.student.findMany({
    where: { coachId: coach.id },
    include: {
      parentReports: { orderBy: { createdAt: "desc" }, take: 4 },
      snapshots: { orderBy: { month: "desc" }, take: 2 },
      coachSessions: { orderBy: { date: "desc" }, take: 1 },
    },
    orderBy: { name: "asc" },
  })

  const drafts = students.flatMap(s =>
    s.parentReports
      .filter(r => r.status === "DRAFT")
      .map(r => ({ ...r, studentName: s.name, studentId: s.id }))
  )

  const monthLabel = currentMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" })

  // Roster insights — rating trend vs last month
  function trend(s: typeof students[0]): { dir: "new" | "up" | "down" | "flat"; delta: number } {
    const [cur, prev] = s.snapshots
    if (!cur || !prev) return { dir: "new", delta: 0 }
    const delta = cur.rating - prev.rating
    const dir = delta > 0 ? "up" : delta < 0 ? "down" : "flat"
    return { dir, delta }
  }

  const trends = students.map(s => ({ student: s, ...trend(s) }))
  const improved = trends.filter(t => t.dir === "up")
  const declined = trends.filter(t => t.dir === "down")
  const steady = trends.filter(t => t.dir === "flat")
  const noData = trends.filter(t => t.dir === "new")

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Student Reports</h1>
            <p className="text-muted-foreground text-sm mt-1">{monthLabel} · {drafts.length} draft{drafts.length !== 1 ? "s" : ""} pending review</p>
          </div>
          <GenerateAllButton
            students={students.map(s => ({ id: s.id, name: s.name }))}
          />
        </div>

        {/* Roster insights */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-card border border-border rounded-xl shadow-sm p-4">
            <p className="text-xs text-muted-foreground mb-1">Improved this month</p>
            <p className="text-xl font-bold text-green-600">{improved.length}</p>
            {improved.length > 0 && (
              <p className="text-xs text-muted-foreground truncate mt-1">{improved.map(t => t.student.name.split(" ")[0]).join(", ")}</p>
            )}
          </div>
          <div className="bg-card border border-border rounded-xl shadow-sm p-4">
            <p className="text-xs text-muted-foreground mb-1">Declined</p>
            <p className={`text-xl font-bold ${declined.length > 0 ? "text-red-500" : "text-foreground"}`}>{declined.length}</p>
            {declined.length > 0 && (
              <p className="text-xs text-muted-foreground truncate mt-1">{declined.map(t => t.student.name.split(" ")[0]).join(", ")}</p>
            )}
          </div>
          <div className="bg-card border border-border rounded-xl shadow-sm p-4">
            <p className="text-xs text-muted-foreground mb-1">Steady (no change)</p>
            <p className="text-xl font-bold text-yellow-500">{steady.length}</p>
          </div>
          <div className="bg-card border border-border rounded-xl shadow-sm p-4">
            <p className="text-xs text-muted-foreground mb-1">No data yet</p>
            <p className="text-xl font-bold text-muted-foreground">{noData.length}</p>
          </div>
        </div>

        {/* Draft reports needing review */}
        {drafts.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-amber-700 uppercase tracking-wide mb-3">
              📋 {drafts.length} Draft{drafts.length !== 1 ? "s" : ""} — Review Before Approving
            </h2>
            <div className="space-y-3">
              {drafts.map(r => (
                <DraftCard
                  key={r.id}
                  reportId={r.id}
                  studentName={r.studentName}
                  studentId={r.studentId}
                  content={r.content}
                  month={r.month.toISOString()}
                />
              ))}
            </div>
          </div>
        )}

        {/* Per-student report history */}
        <div className="space-y-4">
          {students.map(s => {
            const snapshot = s.snapshots[0]
            const lastSession = s.coachSessions[0]
            const hasCurrentDraft = s.parentReports.some(
              r => r.status === "DRAFT" && new Date(r.month).getMonth() === currentMonth.getMonth()
            )
            return (
              <div key={s.id} className="bg-card border border-border rounded-xl shadow-sm">
                <div className="px-6 py-4 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                      {s.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Rating {s.rating} · {snapshot?.sessionCount ?? 0} sessions this month
                        {lastSession ? ` · Last session ${new Date(lastSession.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!hasCurrentDraft && (
                      <WriteManuallyButton studentId={s.id} studentName={s.name} />
                    )}
                    <GenerateOneButton studentId={s.id} studentName={s.name} />
                  </div>
                </div>
                {s.parentReports.length === 0 ? (
                  <p className="px-6 py-4 text-sm text-muted-foreground">No reports yet for this student.</p>
                ) : (
                  <div className="divide-y">
                    {s.parentReports.map(r => (
                      <div key={r.id} className="px-6 py-3 flex items-center gap-4">
                        <span className="text-sm text-muted-foreground w-28 flex-shrink-0">
                          {new Date(r.month).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                          r.status === "SENT" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {r.status === "SENT" ? "✓ Sent" : "Draft"}
                        </span>
                        <span className="text-sm text-muted-foreground flex-1 truncate">{r.content.slice(0, 100)}…</span>
                        {r.status === "DRAFT" && (
                          <QuickEditButton reportId={r.id} content={r.content} studentName={s.name} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
    </div>
  )
}
