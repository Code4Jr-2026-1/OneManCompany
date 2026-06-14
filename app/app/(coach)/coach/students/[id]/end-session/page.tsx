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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <a href={`/coach/students/${id}`} className="text-muted-foreground hover:text-foreground text-sm">← Back</a>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-xl font-bold text-foreground">End Session — {student.name}</h1>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-sm text-blue-700">
          ⚡ Quick capture — 30 seconds. AI will expand this into a full summary.
        </div>
        <EndSessionForm studentId={id} studentName={student.name} nextScheduled={student.scheduledSessions[0]?.scheduledAt ?? null} />
      </div>
    </div>
  )
}
