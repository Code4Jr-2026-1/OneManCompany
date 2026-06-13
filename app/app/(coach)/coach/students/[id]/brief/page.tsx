import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { AiSuggestion } from "./ai-suggestion"

export default async function PreSessionBrief({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH") redirect("/login")

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      context: true,
      coachSessions: { orderBy: { date: "desc" }, take: 1 },
      homeworkAssignments: { orderBy: { createdAt: "desc" }, take: 3 },
      snapshots: { orderBy: { month: "desc" }, take: 2 },
      plans: { where: { isActive: true }, take: 1 },
    },
  })
  if (!student) notFound()

  const lastSession = student.coachSessions[0]
  const plan = student.plans[0]
  const topics: string[] = plan ? JSON.parse(plan.topics) : []
  const nextTopic = topics[0] ?? null
  const topicMastery: Record<string, number> = student.snapshots[0] ? JSON.parse(student.snapshots[0].topicMastery) : {}
  const weakestTopic = Object.entries(topicMastery).sort((a, b) => a[1] - b[1])[0]
  const ratingChange = student.snapshots[0] && student.snapshots[1]
    ? student.snapshots[0].rating - student.snapshots[1].rating : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Link href="/coach/students" className="text-gray-500 hover:text-gray-700 text-sm">← Students</Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-700 font-medium">{student.name}</span>
        <span className="text-gray-300">/</span>
        <span className="font-semibold text-blue-600">Pre-Session Brief</span>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">📋 Pre-Session Brief</h1>
            <p className="text-gray-500 text-sm mt-1">{student.name} · {student.skillLevel} · Rating {student.rating} ({ratingChange >= 0 ? "+" : ""}{ratingChange})</p>
          </div>
          <Link href={`/coach/students/${id}/end-session`}>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">Start Session →</button>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Last session */}
          <div className="bg-white rounded-xl border p-5">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-blue-600">📖</span> Last Session
            </h2>
            {lastSession ? (
              <div className="space-y-2 text-sm">
                <p className="text-gray-400 text-xs">{new Date(lastSession.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
                {lastSession.topicsCovered && <p className="text-gray-700"><span className="font-medium">Covered:</span> {lastSession.topicsCovered}</p>}
                {lastSession.coachNotes && <p className="text-gray-700">{lastSession.coachNotes}</p>}
                {lastSession.homeworkSet && (
                  <div className="mt-2 p-2 bg-orange-50 rounded-lg">
                    <p className="text-xs font-medium text-orange-700">Homework set:</p>
                    <p className="text-xs text-orange-600">{lastSession.homeworkSet}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No previous sessions recorded.</p>
            )}
          </div>

          {/* Homework status */}
          <div className="bg-white rounded-xl border p-5">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-orange-500">📝</span> Homework Status
            </h2>
            {student.homeworkAssignments.length === 0 ? (
              <p className="text-sm text-gray-400">No homework assigned yet.</p>
            ) : (
              <div className="space-y-2">
                {student.homeworkAssignments.map(hw => (
                  <div key={hw.id} className={`p-3 rounded-lg ${hw.status === "DONE" ? "bg-green-50 border border-green-100" : "bg-orange-50 border border-orange-100"}`}>
                    <div className="flex items-start gap-2">
                      <span className="text-base">{hw.status === "DONE" ? "✅" : "⏳"}</span>
                      <div>
                        <p className="text-sm font-medium">{hw.title}</p>
                        {hw.studentNote && <p className="text-xs text-gray-500 mt-0.5">Student note: {hw.studentNote}</p>}
                        {hw.dueDate && <p className="text-xs text-gray-400">Due: {new Date(hw.dueDate).toLocaleDateString()}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Weak areas */}
          <div className="bg-white rounded-xl border p-5">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-red-500">🎯</span> Weaknesses
            </h2>
            {student.weakness && (
              <div className="mb-3 p-3 bg-red-50 rounded-lg border border-red-100">
                <p className="text-xs text-red-400 font-medium mb-0.5">Coach-noted</p>
                <p className="text-sm text-red-700">{student.weakness}</p>
              </div>
            )}
            {weakestTopic ? (
              <div className="space-y-3">
                <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                  <p className="font-medium text-red-800 capitalize">{weakestTopic[0]}</p>
                  <p className="text-sm text-red-600">{weakestTopic[1]}% mastery — needs most attention</p>
                </div>
                {Object.entries(topicMastery).sort((a,b) => a[1]-b[1]).slice(1,3).map(([t, v]) => (
                  <div key={t} className="flex justify-between text-sm items-center">
                    <span className="capitalize text-gray-600">{t}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-400 rounded-full" style={{ width: `${v}%` }} />
                      </div>
                      <span className="text-gray-400 text-xs w-8 text-right">{v}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-gray-400">No mastery data yet.</p>}
          </div>

          {/* AI session suggestion */}
          <div className="bg-white rounded-xl border p-5">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-purple-600">✦</span> AI Session Plan
            </h2>
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

        <div className="mt-6 flex gap-3">
          <Link href={`/coach/students/${id}/end-session`} className="flex-1">
            <button className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700">
              ✓ Start Session & Log Afterwards
            </button>
          </Link>
          <Link href={`/coach/students/${id}`}>
            <button className="border px-6 py-3 rounded-xl text-sm font-medium hover:bg-gray-50">Full Profile</button>
          </Link>
        </div>
      </div>
    </div>
  )
}
