import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"

export default async function StudentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH") redirect("/login")

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      context: true,
      sessions: { orderBy: { date: "desc" }, take: 5 },
      gameAnalyses: { orderBy: { createdAt: "desc" }, take: 5 },
      snapshots: { orderBy: { month: "desc" }, take: 3 },
      plans: { where: { isActive: true }, take: 1 },
    },
  })
  if (!student) notFound()

  const plan = student.plans[0]
  const milestones: { title: string; done: boolean }[] = plan ? JSON.parse(plan.milestones) : []
  const topics: string[] = plan ? JSON.parse(plan.topics) : []
  const topicMastery: Record<string, number> = student.snapshots[0] ? JSON.parse(student.snapshots[0].topicMastery) : {}

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Link href="/coach" className="text-gray-500 hover:text-gray-700 text-sm">← Dashboard</Link>
        <span className="text-gray-300">/</span>
        <span className="font-semibold text-gray-900">{student.name}</span>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-3 gap-6">
        {/* Left: profile + context */}
        <div className="col-span-1 space-y-4">
          <div className="bg-white rounded-xl border p-5">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl mx-auto mb-3">
              {student.name.split(" ").map(n => n[0]).join("").slice(0,2)}
            </div>
            <h2 className="text-lg font-bold text-gray-900 text-center">{student.name}</h2>
            <p className="text-sm text-gray-500 text-center capitalize">{student.skillLevel}</p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Rating</span><span className="font-semibold">{student.rating}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Age</span><span className="font-semibold">{student.age ?? "—"}</span></div>
            </div>
            {student.goals && <div className="mt-4 p-3 bg-blue-50 rounded-lg"><p className="text-xs text-gray-500 mb-1">Goals</p><p className="text-sm text-gray-700">{student.goals}</p></div>}
            <div className="mt-4 flex gap-2">
              <Link href={`/coach/students/${id}/session`} className="flex-1">
                <button className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700">+ Session Note</button>
              </Link>
            </div>
          </div>

          {/* AI Context */}
          {student.context && (
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 bg-purple-100 rounded text-purple-600 flex items-center justify-center text-xs">✦</span>
                AI Student Context
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">{student.context.contextSummary}</p>
            </div>
          )}

          {/* Topic Mastery */}
          {Object.keys(topicMastery).length > 0 && (
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Topic Mastery</h3>
              <div className="space-y-3">
                {Object.entries(topicMastery).map(([topic, score]) => (
                  <div key={topic}>
                    <div className="flex justify-between text-xs text-gray-600 mb-1 capitalize">
                      <span>{topic}</span><span>{score}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: sessions, plan, analyses */}
        <div className="col-span-2 space-y-4">
          {/* Improvement Plan */}
          {plan && (
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Active Improvement Plan</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-2">Topics</p>
                  <div className="space-y-1">
                    {topics.map(t => <div key={t} className="text-sm text-gray-700 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />{t}</div>)}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">Milestones</p>
                  <div className="space-y-1">
                    {milestones.map((m, i) => (
                      <div key={i} className={`text-sm flex items-center gap-2 ${m.done ? "text-green-600" : "text-gray-700"}`}>
                        <span>{m.done ? "✓" : "○"}</span>{m.title}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Sessions */}
          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Recent Sessions</h3>
              <Link href={`/coach/students/${id}/session`} className="text-sm text-blue-600 hover:underline">+ Add</Link>
            </div>
            {student.sessions.length === 0 ? (
              <p className="text-sm text-gray-400">No sessions recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {student.sessions.map(s => (
                  <div key={s.id} className="border-l-2 border-blue-200 pl-3">
                    <p className="text-xs text-gray-400">{new Date(s.date).toLocaleDateString()}</p>
                    {s.coachNotes && <p className="text-sm text-gray-700 mt-0.5">{s.coachNotes}</p>}
                    {s.aiSummary && <p className="text-xs text-blue-600 mt-1">✦ {s.aiSummary}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Game Analyses */}
          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Game Analyses</h3>
            </div>
            {student.gameAnalyses.length === 0 ? (
              <p className="text-sm text-gray-400">No game analyses yet.</p>
            ) : (
              <div className="space-y-3">
                {student.gameAnalyses.map(a => (
                  <div key={a.id} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleDateString()}</p>
                    {a.aiAnalysis && <p className="text-sm text-gray-700 mt-1">{a.aiAnalysis.slice(0, 200)}…</p>}
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
