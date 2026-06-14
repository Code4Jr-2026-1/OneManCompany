import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { AnalysisForm } from "./form"

export default async function AnalysisPage() {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "STUDENT") redirect("/login")

  const user = await prisma.user.findUnique({ where: { email: session.user!.email! } })
  const student = user ? await prisma.student.findFirst({
    where: { userId: user.id },
    include: { gameAnalyses: { orderBy: { createdAt: "desc" }, take: 5 } },
  }) : null

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card border-b border-border px-6 py-4 flex items-center gap-4">
        <a href="/student" className="text-muted-foreground hover:text-foreground text-sm">← Back</a>
        <span className="font-semibold text-foreground">Game Analysis</span>
      </nav>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Analyse Your Game</h1>
        <p className="text-muted-foreground mb-8">Paste a PGN and get AI-powered move-by-move feedback</p>
        <div className="grid grid-cols-2 gap-6">
          <AnalysisForm studentId={student?.id ?? null} skillLevel={student?.skillLevel ?? "beginner"} />
          <div>
            <h2 className="font-semibold text-foreground mb-4">Recent Analyses</h2>
            {!student?.gameAnalyses.length ? (
              <div className="bg-card border border-border shadow-sm rounded-xl p-6 text-muted-foreground text-sm">No analyses yet. Submit your first game!</div>
            ) : (
              <div className="space-y-3">
                {student.gameAnalyses.map(a => (
                  <div key={a.id} className="bg-card border border-border shadow-sm rounded-xl p-4">
                    <p className="text-xs text-muted-foreground mb-2">{new Date(a.createdAt).toLocaleDateString()}</p>
                    {a.aiAnalysis && <p className="text-sm text-foreground leading-relaxed">{a.aiAnalysis.slice(0, 300)}…</p>}
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
