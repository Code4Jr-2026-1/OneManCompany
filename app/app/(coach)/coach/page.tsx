import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { SignOutButton } from "@/components/sign-out-button"

export default async function CoachDashboard() {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH") redirect("/login")

  const coach = await prisma.user.findUnique({ where: { email: session.user!.email! } })
  if (!coach) redirect("/login")

  const students = await prisma.student.findMany({
    where: { coachId: coach.id },
    include: { snapshots: { orderBy: { month: "desc" }, take: 2 }, sessions: { orderBy: { date: "desc" }, take: 1 } },
    orderBy: { updatedAt: "desc" },
  })

  const totalStudents = students.length
  const avgRating = students.length ? Math.round(students.reduce((a, s) => a + s.rating, 0) / students.length) : 0
  const improving = students.filter(s => {
    const [cur, prev] = s.snapshots
    return cur && prev && cur.improvementRate > prev.improvementRate
  }).length

  function trend(s: typeof students[0]) {
    const [cur, prev] = s.snapshots
    if (!cur || !prev) return "new"
    return cur.rating > prev.rating ? "up" : cur.rating < prev.rating ? "down" : "plateau"
  }

  function lastActive(s: typeof students[0]) {
    const last = s.sessions[0]
    if (!last) return "No sessions yet"
    const diff = Math.floor((Date.now() - last.date.getTime()) / 86400000)
    if (diff === 0) return "Today"
    if (diff === 1) return "Yesterday"
    return `${diff} days ago`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-bold">♟</div>
          <span className="font-semibold text-gray-900">Chess Coach Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/coach/students/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">+ Add Student</Link>
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs">
            {coach.name?.split(" ").map(n => n[0]).join("") ?? "C"}
          </div>
          <SignOutButton />
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Good morning, {coach.name?.split(" ")[0]} 👋</h1>
          <p className="text-gray-500 text-sm mt-1">{totalStudents} active students · {improving} improving this month</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Students", value: totalStudents, sub: "All active", color: "blue" },
            { label: "Avg Rating", value: avgRating, sub: "Across all students", color: "green" },
            { label: "Improving", value: `${totalStudents ? Math.round(improving / totalStudents * 100) : 0}%`, sub: `${improving} of ${totalStudents}`, color: "purple" },
            { label: "Sessions This Month", value: students.reduce((a, s) => a + (s.snapshots[0]?.sessionCount ?? 0), 0), sub: "Total sessions", color: "orange" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border p-5">
              <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Student list */}
        <div className="bg-white rounded-xl border">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold text-gray-900">Student Roster</h2>
          </div>
          {students.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400">
              No students yet. <Link href="/coach/students/new" className="text-blue-600 hover:underline">Add your first student →</Link>
            </div>
          ) : (
            <div className="divide-y">
              {students.map((s) => {
                const t = trend(s)
                const initials = s.name.split(" ").map(n => n[0]).join("").slice(0, 2)
                const inactive = s.sessions[0] ? Math.floor((Date.now() - s.sessions[0].date.getTime()) / 86400000) >= 5 : true
                return (
                  <div key={s.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm flex-shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{s.name}</p>
                        {inactive && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Needs attention</span>}
                      </div>
                      <p className="text-sm text-gray-500 capitalize">{s.skillLevel} · {lastActive(s)}</p>
                    </div>
                    <div className="text-center w-20">
                      <p className="font-semibold text-gray-900">{s.rating}</p>
                      <p className="text-xs text-gray-400">Rating</p>
                    </div>
                    <div className={`text-lg font-bold w-8 text-center ${t === "up" ? "text-green-600" : t === "down" ? "text-red-500" : "text-yellow-500"}`}>
                      {t === "up" ? "↑" : t === "down" ? "↓" : "→"}
                    </div>
                    <div className="w-32">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{Math.round(s.snapshots[0]?.improvementRate ?? 0)}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(s.snapshots[0]?.improvementRate ?? 0, 100)}%` }} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/coach/students/${s.id}`}>
                        <button className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg text-gray-700">View</button>
                      </Link>
                      <Link href={`/coach/students/${s.id}/session`}>
                        <button className="text-sm bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-blue-700">+ Note</button>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
