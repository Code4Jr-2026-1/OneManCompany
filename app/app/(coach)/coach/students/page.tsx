import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { CoachNav } from "@/components/coach-nav"
import { StudentSearch } from "./search"

export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH") redirect("/login")
  const coach = await prisma.user.findUnique({ where: { email: session.user!.email! } })
  if (!coach) redirect("/login")

  const students = await prisma.student.findMany({
    where: {
      coachId: coach.id,
      ...(q ? { name: { contains: q } } : {}),
    },
    include: {
      coachSessions: { orderBy: { date: "desc" }, take: 1 },
      homeworkAssignments: { where: { status: "PENDING" }, take: 1 },
      snapshots: { orderBy: { month: "desc" }, take: 2 },
      scheduledSessions: { where: { scheduledAt: { gte: new Date() } }, orderBy: { scheduledAt: "asc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  })

  const now = new Date()

  function daysInactive(s: typeof students[0]) {
    const last = s.coachSessions[0]
    if (!last) return 999
    return Math.floor((now.getTime() - new Date(last.date).getTime()) / 86400000)
  }

  function trend(s: typeof students[0]) {
    const [cur, prev] = s.snapshots
    if (!cur || !prev) return { dir: "new", delta: 0 }
    const delta = cur.rating - prev.rating
    return { dir: delta > 0 ? "up" : delta < 0 ? "down" : "flat", delta }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CoachNav coachName={coach.name ?? "Coach"} />
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Students</h1>
            <p className="text-gray-500 text-sm mt-1">
              {students.length} student{students.length !== 1 ? "s" : ""}{q ? ` matching "${q}"` : " enrolled"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StudentSearch defaultValue={q ?? ""} />
            <Link href="/coach/compare">
              <button className="border px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-700">⚖ Compare</button>
            </Link>
            <Link href="/coach/students/new">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">+ Add Student</button>
            </Link>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-3 text-xs text-gray-400">
          <span className="font-medium text-gray-500">Trend (vs last month):</span>
          <span className="flex items-center gap-1"><span className="text-green-600 font-bold">↑</span> Rating improved</span>
          <span className="flex items-center gap-1"><span className="text-red-500 font-bold">↓</span> Rating dropped</span>
          <span className="flex items-center gap-1"><span className="text-yellow-500 font-bold">→</span> No change</span>
          <span className="flex items-center gap-1"><span className="text-gray-400 font-bold">✦</span> New / no data yet</span>
        </div>

        <div className="bg-white rounded-xl border">
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b text-xs font-semibold text-gray-400 uppercase tracking-wide">
            <div className="col-span-3">Student</div>
            <div className="col-span-1 text-center">Rating</div>
            <div className="col-span-1 text-center">Trend</div>
            <div className="col-span-2 text-center">Homework</div>
            <div className="col-span-2">Next Session</div>
            <div className="col-span-1 text-center">Inactive</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          {students.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400">
              {q ? <>No students match &quot;{q}&quot;.</> : <>No students yet. <Link href="/coach/students/new" className="text-blue-600 hover:underline">Add your first student →</Link></>}
            </div>
          ) : students.map(s => {
            const { dir: t, delta } = trend(s)
            const days = daysInactive(s)
            const hw = s.homeworkAssignments[0]
            const next = s.scheduledSessions[0]
            const initials = s.name.split(" ").map(n => n[0]).join("").slice(0,2)
            return (
              <div key={s.id} className={`grid grid-cols-12 gap-4 px-6 py-4 border-b last:border-0 items-center hover:bg-gray-50 ${days >= 7 ? "bg-red-50/30" : ""}`}>
                <div className="col-span-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs flex-shrink-0">{initials}</div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{s.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{s.skillLevel}</p>
                  </div>
                </div>
                <div className="col-span-1 text-center">
                  <span className="font-semibold text-gray-900">{s.rating}</span>
                </div>
                <div className="col-span-1 text-center">
                  {t === "new" ? (
                    <span className="text-gray-400 text-sm" title="No monthly snapshots yet — trend will appear after first progress snapshot">✦ New</span>
                  ) : t === "up" ? (
                    <span className="text-green-600 font-semibold" title={`Rating improved by ${delta} points vs last month`}>
                      ↑ <span className="text-xs">+{delta}</span>
                    </span>
                  ) : t === "down" ? (
                    <span className="text-red-500 font-semibold" title={`Rating dropped by ${Math.abs(delta)} points vs last month`}>
                      ↓ <span className="text-xs">{delta}</span>
                    </span>
                  ) : (
                    <span className="text-yellow-500 font-semibold" title="Rating unchanged vs last month">→ <span className="text-xs text-gray-400">±0</span></span>
                  )}
                </div>
                <div className="col-span-2 text-center">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${!hw ? "bg-gray-100 text-gray-500" : "bg-orange-100 text-orange-700"}`}>
                    {!hw ? "✓ Clear" : "⏳ Pending"}
                  </span>
                </div>
                <div className="col-span-2 text-sm text-gray-600">
                  {next ? new Date(next.scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : <span className="text-gray-400">Not scheduled</span>}
                </div>
                <div className="col-span-1 text-center">
                  <span className={`text-xs font-semibold ${days >= 7 ? "text-red-600" : days >= 4 ? "text-amber-600" : "text-green-600"}`}>
                    {days >= 999 ? "Never" : `${days}d`}
                  </span>
                </div>
                <div className="col-span-2 flex gap-1.5 justify-end">
                  <Link href={`/coach/students/${s.id}`}><button className="text-xs bg-gray-100 hover:bg-gray-200 px-2.5 py-1.5 rounded text-gray-700">View</button></Link>
                  <Link href={`/coach/students/${s.id}/brief`}><button className="text-xs bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded text-blue-700">Brief</button></Link>
                  <Link href={`/coach/students/${s.id}/end-session`}><button className="text-xs bg-green-50 hover:bg-green-100 px-2.5 py-1.5 rounded text-green-700">End</button></Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
