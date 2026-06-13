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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Link href="/coach/students" className="text-gray-500 hover:text-gray-700 text-sm">← Students</Link>
        <span className="text-gray-300">/</span>
        <span className="font-semibold text-gray-900">{student.name}</span>
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
          </div>

          {student.context && (
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold text-gray-900 mb-3">✦ AI Context</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{student.context.contextSummary}</p>
            </div>
          )}

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
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Active Improvement Plan</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-2">Topics</p>
                  {topics.map(t => <div key={t} className="text-sm text-gray-700 flex items-center gap-2 mb-1"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />{t}</div>)}
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">Milestones</p>
                  {milestones.map((m, i) => (
                    <div key={i} className={`text-sm flex items-center gap-2 mb-1 ${m.done ? "text-green-600" : "text-gray-700"}`}>
                      <span>{m.done ? "✓" : "○"}</span>{m.title}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Homework */}
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Homework</h3>
            {student.homeworkAssignments.length === 0 ? (
              <p className="text-sm text-gray-400">No homework assigned yet.</p>
            ) : (
              <div className="space-y-2">
                {student.homeworkAssignments.map(hw => (
                  <div key={hw.id} className={`flex items-center gap-3 p-2 rounded-lg ${hw.status === "DONE" ? "bg-green-50" : "bg-orange-50"}`}>
                    <span className="text-base">{hw.status === "DONE" ? "✅" : "⏳"}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{hw.title}</p>
                      {hw.dueDate && <p className="text-xs text-gray-400">Due {new Date(hw.dueDate).toLocaleDateString()}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sessions */}
          <div className="bg-white rounded-xl border p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Recent Sessions</h3>
              <Link href={`/coach/students/${id}/end-session`} className="text-sm text-blue-600 hover:underline">+ Log Session</Link>
            </div>
            {student.coachSessions.length === 0 ? (
              <p className="text-sm text-gray-400">No sessions recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {student.coachSessions.map(s => (
                  <div key={s.id} className="border-l-2 border-blue-200 pl-3">
                    <p className="text-xs text-gray-400">{new Date(s.date).toLocaleDateString()}</p>
                    {s.topicsCovered && <p className="text-sm font-medium text-gray-800">{s.topicsCovered}</p>}
                    {s.coachNotes && <p className="text-sm text-gray-700 mt-0.5">{s.coachNotes}</p>}
                    {s.aiSummary && <p className="text-xs text-blue-600 mt-1">✦ {s.aiSummary}</p>}
                    {s.homeworkSet && <p className="text-xs text-orange-600 mt-1">HW: {s.homeworkSet}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Game Analyses */}
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Game Analyses</h3>
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
