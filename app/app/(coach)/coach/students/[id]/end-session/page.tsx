import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { EndSessionForm } from "./form"

export default async function EndSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH") redirect("/login")

  const student = await prisma.student.findUnique({ where: { id }, include: { scheduledSessions: { where: { scheduledAt: { gte: new Date() } }, orderBy: { scheduledAt: "asc" }, take: 1 } } })
  if (!student) notFound()

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <a href={`/coach/students/${id}`} className="text-gray-500 hover:text-gray-700 text-sm">← Back</a>
          <span className="text-gray-300">/</span>
          <h1 className="text-xl font-bold text-gray-900">End Session — {student.name}</h1>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-sm text-blue-700">
          ⚡ Quick capture — 30 seconds. AI will expand this into a full summary.
        </div>
        <EndSessionForm studentId={id} studentName={student.name} nextScheduled={student.scheduledSessions[0]?.scheduledAt ?? null} />
      </div>
    </div>
  )
}
