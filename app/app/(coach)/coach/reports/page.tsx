import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { CoachNav } from "@/components/coach-nav"
import { GenerateAllReportsButton, SingleReportButton } from "./generate-button"

export default async function ReportsPage() {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH") redirect("/login")
  const coach = await prisma.user.findUnique({ where: { email: session.user!.email! } })
  if (!coach) redirect("/login")

  const students = await prisma.student.findMany({
    where: { coachId: coach.id },
    include: {
      parentReports: { orderBy: { createdAt: "desc" }, take: 3 },
      snapshots: { orderBy: { month: "desc" }, take: 1 },
    },
    orderBy: { name: "asc" },
  })

  const drafts = students.flatMap(s =>
    s.parentReports.filter(r => r.status === "DRAFT").map(r => ({ ...r, studentName: s.name }))
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <CoachNav coachName={coach.name ?? "Coach"} />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Parent Reports</h1>
            <p className="text-gray-500 text-sm mt-1">{drafts.length} draft{drafts.length !== 1 ? "s" : ""} ready for review</p>
          </div>
          <GenerateAllReportsButton
            students={students.map(s => ({ id: s.id, name: s.name, rating: s.rating, snapshot: s.snapshots[0] ?? null }))}
          />
        </div>

        {drafts.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl mb-6 divide-y divide-amber-100">
            <div className="px-6 py-3 font-semibold text-amber-800 text-sm">📋 Draft Reports — Review & Send</div>
            {drafts.map(r => (
              <div key={r.id} className="px-6 py-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-medium text-gray-900">{r.studentName}</span>
                    <span className="text-gray-400 text-sm ml-2">
                      · {new Date(r.month).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-700 bg-white rounded-lg p-3 border">{r.content.slice(0, 300)}…</p>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-4">
          {students.map(s => (
            <div key={s.id} className="bg-white rounded-xl border">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <span className="font-semibold text-gray-900">{s.name}</span>
                <SingleReportButton
                  studentId={s.id}
                  studentName={s.name}
                  rating={s.rating}
                  snapshot={s.snapshots[0] ?? null}
                />
              </div>
              {s.parentReports.length === 0 ? (
                <p className="px-6 py-4 text-sm text-gray-400">No reports generated yet.</p>
              ) : (
                <div className="divide-y">
                  {s.parentReports.map(r => (
                    <div key={r.id} className="px-6 py-3 flex items-center gap-4">
                      <span className="text-sm text-gray-500 w-32">
                        {new Date(r.month).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === "SENT" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                        {r.status}
                      </span>
                      <span className="text-sm text-gray-600 flex-1 truncate">{r.content.slice(0, 80)}…</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
