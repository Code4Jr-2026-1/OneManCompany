import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { CoachNav } from "@/components/coach-nav"
import Link from "next/link"

export default async function ComparePage() {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH") redirect("/login")
  const coach = await prisma.user.findUnique({ where: { email: session.user!.email! } })
  if (!coach) redirect("/login")

  const students = await prisma.student.findMany({
    where: { coachId: coach.id },
    include: {
      snapshots: { orderBy: { month: "desc" }, take: 2 },
      coachSessions: { orderBy: { date: "desc" }, take: 1 },
      homeworkAssignments: { take: 10 },
      plans: { where: { isActive: true }, take: 1 },
    },
    orderBy: { rating: "desc" },
  })

  function hwCompletion(s: typeof students[0]) {
    const all = s.homeworkAssignments
    if (!all.length) return null
    const done = all.filter(h => h.status === "DONE").length
    return Math.round(done / all.length * 100)
  }

  function ratingChange(s: typeof students[0]) {
    const [cur, prev] = s.snapshots
    if (!cur || !prev) return null
    return cur.rating - prev.rating
  }

  function planProgress(s: typeof students[0]) {
    const plan = s.plans[0]
    if (!plan) return null
    const m: { done: boolean }[] = JSON.parse(plan.milestones)
    if (!m.length) return 0
    return Math.round(m.filter(x => x.done).length / m.length * 100)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CoachNav coachName={coach.name ?? "Coach"} />
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">⚖ Student Comparison</h1>
            <p className="text-gray-500 text-sm mt-1">Who&apos;s on track vs who needs more attention</p>
          </div>
          <Link href="/coach/students"><button className="border px-4 py-2 rounded-lg text-sm hover:bg-white">← Back to Students</button></Link>
        </div>

        <div className="bg-white rounded-xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Student</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Rating</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Change</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Sessions</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">HW %</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Plan %</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {students.map(s => {
                const rc = ratingChange(s)
                const hw = hwCompletion(s)
                const pp = planProgress(s)
                const sessions = s.snapshots[0]?.sessionCount ?? 0
                const onTrack = (hw ?? 100) >= 60 && (rc ?? 0) >= 0 && sessions >= 3

                return (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                          {s.name.split(" ").map(n => n[0]).join("").slice(0,2)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{s.name}</p>
                          <p className="text-xs text-gray-400 capitalize">{s.skillLevel}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center font-semibold text-gray-900">{s.rating}</td>
                    <td className="px-4 py-4 text-center">
                      {rc === null ? <span className="text-gray-300">—</span> :
                       <span className={`font-semibold ${rc > 0 ? "text-green-600" : rc < 0 ? "text-red-500" : "text-gray-400"}`}>
                         {rc > 0 ? "+" : ""}{rc}
                       </span>}
                    </td>
                    <td className="px-4 py-4 text-center text-gray-700">{sessions}</td>
                    <td className="px-4 py-4 text-center">
                      {hw === null ? <span className="text-gray-300">—</span> :
                       <span className={`font-semibold ${hw >= 80 ? "text-green-600" : hw >= 50 ? "text-amber-600" : "text-red-500"}`}>{hw}%</span>}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {pp === null ? <span className="text-gray-300">—</span> :
                       <span className={`font-semibold ${pp >= 70 ? "text-green-600" : pp >= 40 ? "text-amber-600" : "text-red-500"}`}>{pp}%</span>}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${onTrack ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {onTrack ? "✓ On Track" : "⚠ Attention"}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
