import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { PhoneEditor } from "./phone-editor"

export default async function StudentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH") redirect("/login")

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      context: true,
      coachSessions: { orderBy: { date: "desc" }, take: 5 },
      gameAnalyses: { orderBy: { createdAt: "desc" }, take: 5 },
      snapshots: { orderBy: { month: "desc" }, take: 3 },
      plans: { where: { isActive: true }, take: 1 },
      homeworkAssignments: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  })
  if (!student) notFound()

  const plan = student.plans[0]
  const milestones: { title: string; done: boolean }[] = plan ? JSON.parse(plan.milestones) : []
  const topics: string[] = plan ? JSON.parse(plan.topics) : []
  const topicMastery: Record<string, number> = student.snapshots[0] ? JSON.parse(student.snapshots[0].topicMastery) : {}

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card border-b px-6 py-4 flex items-center gap-4">
        <Link href="/coach/students" className="text-muted-foreground hover:text-foreground text-sm">← Students</Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-semibold text-foreground">{student.name}</span>
        <div className="ml-auto flex gap-2">
          <Link href={`/coach/students/${id}/brief`}>
            <button className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700">📋 Brief</button>
          </Link>
          <Link href={`/coach/students/${id}/end-session`}>
            <button className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700">✓ End Session</button>
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
              <div className="flex justify-between"><span className="text-muted-foreground">Rating</span><span className="font-semibold">{student.rating}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Age</span><span className="font-semibold">{student.age ?? "—"}</span></div>
              <div className="flex justify-between items-center"><span className="text-muted-foreground">WhatsApp</span><PhoneEditor studentId={student.id} phone={student.phone} /></div>
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
        </div>

        {/* Right: sessions, plan, analyses, homework */}
        <div className="col-span-2 space-y-4">
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
                {student.coachSessions.map(s => {
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
