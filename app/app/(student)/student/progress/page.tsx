import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

export default async function ProgressPage() {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "STUDENT") redirect("/login")

  const user = await prisma.user.findUnique({ where: { email: session.user!.email! } })
  const student = user ? await prisma.student.findFirst({
    where: { userId: user.id },
    include: { snapshots: { orderBy: { month: "asc" } }, plans: { where: { isActive: true }, take: 1 } },
  }) : null

  const snapshots = student?.snapshots ?? []
  const latestTopics: Record<string, number> = snapshots.length ? JSON.parse(snapshots.at(-1)!.topicMastery) : {}

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-card border-b border-border px-6 py-4 flex items-center gap-4">
        <a href="/student" className="text-muted-foreground hover:text-foreground text-sm">← Back</a>
        <span className="font-semibold text-foreground">My Progress</span>
      </nav>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-8">Progress Tracker</h1>

        {/* Rating history */}
        <div className="bg-card border border-border shadow-sm rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-foreground mb-4">Rating History</h2>
          {snapshots.length < 2 ? (
            <p className="text-muted-foreground text-sm">Not enough data yet. Keep playing and logging sessions!</p>
          ) : (
            <div className="flex items-end gap-3 h-32">
              {snapshots.map((s, i) => {
                const max = Math.max(...snapshots.map(x => x.rating))
                const min = Math.min(...snapshots.map(x => x.rating))
                const h = max === min ? 50 : Math.round(((s.rating - min) / (max - min)) * 80) + 20
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-muted-foreground">{s.rating}</span>
                    <div className="w-full bg-blue-500 rounded-t" style={{ height: `${h}%` }} />
                    <span className="text-xs text-muted-foreground">{new Date(s.month).toLocaleDateString("en", { month: "short" })}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Topic mastery */}
        {Object.keys(latestTopics).length > 0 && (
          <div className="bg-card border border-border shadow-sm rounded-xl p-5 mb-6">
            <h2 className="font-semibold text-foreground mb-4">Topic Mastery</h2>
            <div className="space-y-4">
              {Object.entries(latestTopics).map(([topic, score]) => (
                <div key={topic}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize text-foreground">{topic}</span>
                    <span className="text-muted-foreground">{score}%</span>
                  </div>
                  <div className="h-3 bg-secondary rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${score >= 70 ? "bg-green-500" : score >= 50 ? "bg-blue-500" : "bg-yellow-500"}`}
                      style={{ width: `${score}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monthly stats */}
        {snapshots.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Current Rating", value: student?.rating ?? 0 },
              { label: "Total Sessions", value: snapshots.reduce((a, s) => a + s.sessionCount, 0) },
              { label: "Avg Improvement", value: `${Math.round(snapshots.reduce((a, s) => a + s.improvementRate, 0) / snapshots.length)}%` },
            ].map(s => (
              <div key={s.label} className="bg-card border border-border shadow-sm rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-muted-foreground text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
