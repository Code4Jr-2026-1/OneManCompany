import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { PhoneEditor } from "./phone-editor"
import { RatingEditor } from "./rating-editor"
import { BillingEditor } from "./billing-editor"
import { AiSuggestion } from "./ai-suggestion"
import { AiSummary } from "./ai-summary"
import { MonthlyAttendance } from "./monthly-attendance"

export default async function StudentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH") redirect("/login")

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      context: true,
      coachSessions: { orderBy: { date: "desc" } },
      gameAnalyses: { orderBy: { createdAt: "desc" }, take: 5 },
      snapshots: { orderBy: { month: "desc" }, take: 3 },
      plans: { where: { isActive: true }, take: 1 },
      homeworkAssignments: { orderBy: { createdAt: "desc" }, take: 5 },
      billingEntries: true,
    },
  })
  if (!student) notFound()

  const plan = student.plans[0]
  const milestones: { title: string; done: boolean }[] = plan ? JSON.parse(plan.milestones) : []
  const topics: string[] = plan ? JSON.parse(plan.topics) : []
  const topicMastery: Record<string, number> = student.snapshots[0] ? JSON.parse(student.snapshots[0].topicMastery) : {}
  const weakestTopic = Object.entries(topicMastery).sort((a, b) => a[1] - b[1])[0]
  const ratingChange = student.snapshots[0] && student.snapshots[1]
    ? student.snapshots[0].rating - student.snapshots[1].rating : 0

  const lastSession = student.coachSessions[0]
  const nextTopic = topics[0] ?? null

  // Monthly attendance: last 6 months including current
  const now = new Date()
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const sessions = student.coachSessions
      .filter(s => {
        const sd = new Date(s.date)
        return sd.getFullYear() === d.getFullYear() && sd.getMonth() === d.getMonth()
      })
      .map(s => ({ id: s.id, date: s.date.toISOString(), duration: s.duration, topicsCovered: s.topicsCovered, coachNotes: s.coachNotes, aiSummary: s.aiSummary, homeworkSet: s.homeworkSet }))
    return { key, label: d.toLocaleDateString("en-IN", { month: "short" }), count: sessions.length, sessions }
  })

  const pendingAmount = student.billingEntries.filter(e => !e.paid).reduce((a, e) => a + e.amount, 0)
  const homeworkDone = student.homeworkAssignments.filter(h => h.status === "DONE").length
  const homeworkTotal = student.homeworkAssignments.length

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card border-b px-6 py-4 flex items-center gap-4">
        <Link href="/coach/students" className="text-muted-foreground hover:text-foreground text-sm">← Students</Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-semibold text-foreground">{student.name}</span>
        <div className="ml-auto flex gap-2">
          <Link href={`/coach`}>
            <button className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700">Today →</button>
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-3 gap-6">
        {/* Left: profile + context */}
        <div className="col-span-1 space-y-4">
          <div className="bg-card border border-border rounded-xl shadow-sm p-5">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl mx-auto mb-3">
              {student.name.split(" ").map(n => n[0]).join("").slice(0,2)}
            </div>
            <h2 className="text-lg font-bold text-foreground text-center">{student.name}</h2>
            <p className="text-sm text-muted-foreground text-center capitalize">{student.skillLevel}</p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between items-center"><span className="text-muted-foreground">Rating</span><span className="font-semibold flex items-center gap-1.5">{student.rating} {ratingChange !== 0 && <span className={ratingChange > 0 ? "text-green-600" : "text-red-600"}>({ratingChange >= 0 ? "+" : ""}{ratingChange})</span>}<RatingEditor studentId={student.id} rating={student.rating} /></span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Age</span><span className="font-semibold">{student.age ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Sessions completed</span><span className="font-semibold">{student.coachSessions.length}</span></div>
              {lastSession && <div className="flex justify-between"><span className="text-muted-foreground">Last session</span><span className="font-semibold">{new Date(lastSession.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span></div>}
              <div className="flex justify-between items-center"><span className="text-muted-foreground">WhatsApp</span><PhoneEditor studentId={student.id} phone={student.phone} /></div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Billing</span>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground capitalize">{(student as { billingType?: string }).billingType ?? "hourly"}</p>
                  <BillingEditor
                    studentId={student.id}
                    billingType={(student as { billingType?: string }).billingType ?? "hourly"}
                    monthlyFee={(student as { monthlyFee?: number | null }).monthlyFee ?? null}
                  />
                </div>
              </div>
              {student.lichessId && <div className="flex justify-between"><span className="text-muted-foreground">Lichess</span><span className="font-semibold">{student.lichessId}</span></div>}
              {student.fideId && <div className="flex justify-between"><span className="text-muted-foreground">FIDE ID</span><span className="font-semibold">{student.fideId}</span></div>}
              {student.aicfId && <div className="flex justify-between"><span className="text-muted-foreground">AICF ID</span><span className="font-semibold">{student.aicfId}</span></div>}
              {student.stateId && <div className="flex justify-between"><span className="text-muted-foreground">State ID</span><span className="font-semibold">{student.stateId}</span></div>}
            </div>
            {student.goals && <div className="mt-4 p-3 bg-blue-50 rounded-lg"><p className="text-xs text-muted-foreground mb-1">Goals</p><p className="text-sm text-foreground">{student.goals}</p></div>}
            {student.weakness && <div className="mt-2 p-3 bg-red-50 rounded-lg"><p className="text-xs text-red-400 mb-1">Known Weaknesses</p><p className="text-sm text-red-700">{student.weakness}</p></div>}
          </div>

          {student.context && (
            <div className="bg-card border border-border rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-foreground mb-3">✦ AI Context</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{student.context.contextSummary}</p>
            </div>
          )}

          {Object.keys(topicMastery).length > 0 && (
            <div className="bg-card border border-border rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-foreground mb-3">Topic Mastery</h3>
              <div className="space-y-3">
                {Object.entries(topicMastery).map(([topic, score]) => (
                  <div key={topic}>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1 capitalize">
                      <span>{topic}</span><span>{score}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment status */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-foreground mb-3">Payment Status</h3>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Pending</p>
                <p className={`text-2xl font-bold ${pendingAmount > 0 ? "text-amber-600" : "text-green-600"}`}>₹{pendingAmount.toLocaleString()}</p>
              </div>
              <Link href={`/coach/billing/${student.id}`} className="text-sm text-blue-600 hover:underline">View Billing →</Link>
            </div>
          </div>
        </div>

        {/* Right: AI summary, plan, sessions, homework */}
        <div className="col-span-2 space-y-4">
          {/* AI Summary & Suggested Plan */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><span className="text-purple-600">✦</span> AI Progress Summary & Suggested Plan</h3>
            <AiSummary
              studentName={student.name}
              skillLevel={student.skillLevel}
              rating={student.rating}
              ratingChange={ratingChange}
              context={student.context?.contextSummary ?? ""}
              topicMastery={topicMastery}
              planTopics={topics}
              recentSessions={student.coachSessions.slice(0, 5).map(s => ({ date: s.date.toISOString(), topicsCovered: s.topicsCovered, aiSummary: s.aiSummary }))}
              homeworkDone={homeworkDone}
              homeworkTotal={homeworkTotal}
              totalSessions={student.coachSessions.length}
            />
          </div>

          {plan && (
            <div className="bg-card border border-border rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-foreground mb-3">Active Improvement Plan</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Topics</p>
                  {topics.map(t => <div key={t} className="text-sm text-foreground flex items-center gap-2 mb-1"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />{t}</div>)}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Milestones</p>
                  {milestones.map((m, i) => (
                    <div key={i} className={`text-sm flex items-center gap-2 mb-1 ${m.done ? "text-green-600" : "text-foreground"}`}>
                      <span>{m.done ? "✓" : "○"}</span>{m.title}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Last session + next session AI plan */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><span className="text-blue-600">📖</span> Last Session</h3>
              {lastSession ? (
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground text-xs">{new Date(lastSession.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
                  {lastSession.topicsCovered && <p className="text-foreground"><span className="font-medium">Covered:</span> {lastSession.topicsCovered}</p>}
                  {lastSession.coachNotes && <p className="text-foreground">{lastSession.coachNotes}</p>}
                  {lastSession.homeworkSet && (
                    <div className="mt-2 p-2 bg-orange-50 rounded-lg">
                      <p className="text-xs font-medium text-orange-700">Homework set:</p>
                      <p className="text-xs text-orange-600">{lastSession.homeworkSet}</p>
                    </div>
                  )}
                </div>
              ) : <p className="text-sm text-muted-foreground">No previous sessions recorded.</p>}
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2"><span className="text-purple-600">✦</span> Next Session Plan</h3>
              <AiSuggestion
                studentName={student.name}
                skillLevel={student.skillLevel}
                context={student.context?.contextSummary ?? ""}
                weakestTopic={weakestTopic ? weakestTopic[0] : null}
                nextPlanTopic={nextTopic}
                lastSessionTopic={lastSession?.topicsCovered ?? null}
              />
            </div>
          </div>

          {/* Monthly attendance */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-foreground mb-3">Monthly Attendance</h3>
            <MonthlyAttendance months={months} totalSessions={student.coachSessions.length} />
          </div>

          {/* Homework */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-foreground mb-3">Homework</h3>
            {student.homeworkAssignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No homework assigned yet.</p>
            ) : (
              <div className="space-y-2">
                {student.homeworkAssignments.map(hw => (
                  <div key={hw.id} className={`flex items-center gap-3 p-2 rounded-lg ${hw.status === "DONE" ? "bg-green-50" : "bg-orange-50"}`}>
                    <span className="text-base">{hw.status === "DONE" ? "✅" : "⏳"}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{hw.title}</p>
                      {hw.dueDate && <p className="text-xs text-muted-foreground">Due {new Date(hw.dueDate).toLocaleDateString()}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sessions */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground">Recent Sessions</h3>
              <Link href={`/coach/students/${id}/end-session`} className="text-sm text-blue-600 hover:underline">+ Log Session</Link>
            </div>
            {student.coachSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sessions recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {student.coachSessions.slice(0, 5).map(s => {
                  let analysis: Record<string, unknown> | null = null
                  try { if (s.aiAnalysis) analysis = JSON.parse(s.aiAnalysis) } catch { /* ignore */ }
                  return (
                    <div key={s.id} className="border-l-2 border-blue-200 pl-3">
                      <p className="text-xs text-muted-foreground">{new Date(s.date).toLocaleDateString()} · {s.duration} min · {s.wellness}</p>
                      {s.topicsCovered && <p className="text-sm font-medium text-foreground">{s.topicsCovered}</p>}
                      {s.aiSummary && <p className="text-xs text-purple-600 mt-1">✦ {s.aiSummary}</p>}
                      {analysis && (analysis.weaknessObserved as string) && !(analysis.weaknessObserved as string).toLowerCase().includes("unable") && (
                        <p className="text-xs text-red-500 mt-0.5">⚠ {analysis.weaknessObserved as string}</p>
                      )}
                      {analysis && (analysis.nextSessionFocus as string) && (
                        <p className="text-xs text-green-600 mt-0.5">→ Next: {analysis.nextSessionFocus as string}</p>
                      )}
                      {s.homeworkSet && <p className="text-xs text-orange-600 mt-0.5">HW: {s.homeworkSet}</p>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Game Analyses */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-5">
            <h3 className="font-semibold text-foreground mb-3">Game Analyses</h3>
            {student.gameAnalyses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No game analyses yet.</p>
            ) : (
              <div className="space-y-3">
                {student.gameAnalyses.map(a => (
                  <div key={a.id} className="bg-secondary rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleDateString()}</p>
                    {a.aiAnalysis && <p className="text-sm text-foreground mt-1">{a.aiAnalysis.slice(0, 200)}…</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
