import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { CoachNav } from "@/components/coach-nav"
import { HomeworkActions } from "./actions"

export default async function HomeworkPage() {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH") redirect("/login")
  const coach = await prisma.user.findUnique({ where: { email: session.user!.email! } })
  if (!coach) redirect("/login")

  const students = await prisma.student.findMany({
    where: { coachId: coach.id },
    include: {
      homeworkAssignments: { orderBy: { createdAt: "desc" }, take: 5 },
    },
    orderBy: { name: "asc" },
  })

  const allHw = students.flatMap(s => s.homeworkAssignments.map(hw => ({ ...hw, studentName: s.name, studentId: s.id })))
  const pending = allHw.filter(h => h.status === "PENDING")
  const done = allHw.filter(h => h.status === "DONE")

  return (
    <div className="min-h-screen bg-gray-50">
      <CoachNav coachName={coach.name ?? "Coach"} />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Homework Tracker</h1>
            <p className="text-gray-500 text-sm mt-1">{pending.length} pending · {done.length} completed</p>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white rounded-xl border mb-6">
          <div className="px-6 py-4 border-b bg-orange-50">
            <h2 className="font-semibold text-orange-800">⏳ Pending Homework ({pending.length})</h2>
          </div>
          {pending.length === 0 ? (
            <p className="px-6 py-6 text-sm text-gray-400">All homework complete! 🎉</p>
          ) : (
            <div className="divide-y">
              {pending.map(hw => (
                <div key={hw.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 text-xs font-bold">
                    {hw.studentName.split(" ").map(n => n[0]).join("").slice(0,2)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{hw.title}</p>
                    <p className="text-xs text-gray-500">{hw.studentName} · {hw.dueDate ? `Due ${new Date(hw.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : "No due date"}</p>
                    {hw.description && <p className="text-xs text-gray-400 mt-0.5">{hw.description}</p>}
                  </div>
                  <HomeworkActions hwId={hw.id} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed */}
        <div className="bg-white rounded-xl border">
          <div className="px-6 py-4 border-b bg-green-50">
            <h2 className="font-semibold text-green-800">✅ Completed ({done.length})</h2>
          </div>
          {done.length === 0 ? (
            <p className="px-6 py-6 text-sm text-gray-400">No completed homework yet.</p>
          ) : (
            <div className="divide-y">
              {done.map(hw => (
                <div key={hw.id} className="px-6 py-3 flex items-center gap-4 opacity-60">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold">
                    {hw.studentName.split(" ").map(n => n[0]).join("").slice(0,2)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm line-through">{hw.title}</p>
                    <p className="text-xs text-gray-500">{hw.studentName} · {hw.completedAt ? `Completed ${new Date(hw.completedAt).toLocaleDateString()}` : "Done"}</p>
                    {hw.studentNote && <p className="text-xs text-blue-600 mt-0.5">Note: {hw.studentNote}</p>}
                  </div>
                  <span className="text-green-600 text-sm font-medium">✓</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
