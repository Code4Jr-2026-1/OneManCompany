import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { SignOutButton } from "@/components/sign-out-button"

export default async function StudentPortal() {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "STUDENT") redirect("/login")

  const user = await prisma.user.findUnique({ where: { email: session.user!.email! } })
  const student = user ? await prisma.student.findFirst({
    where: { userId: user.id },
    include: {
      context: true,
      snapshots: { orderBy: { month: "desc" }, take: 1 },
      plans: { where: { isActive: true }, take: 1 },
    },
  }) : null

  const snapshot = student?.snapshots[0]
  const plan = student?.plans[0]
  const milestones: { title: string; done: boolean }[] = plan ? JSON.parse(plan.milestones) : []
  const doneMilestones = milestones.filter(m => m.done).length

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-sm font-bold">♟</div>
          <span className="font-semibold">My Chess Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-400 text-sm">{user?.name}</span>
          <SignOutButton />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.name?.split(" ")[0]} ♟</h1>
        <p className="text-slate-400 mb-8">
          {student ? `Rating: ${student.rating} · ${student.skillLevel}` : "Let's get you set up with your coach."}
        </p>

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Link href="/student/mentor">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5 hover:from-blue-500 hover:to-blue-600 transition-all cursor-pointer">
              <div className="text-2xl mb-2">🤖</div>
              <h3 className="font-semibold">AI Mentor</h3>
              <p className="text-blue-200 text-sm mt-1">Chat with your personal chess mentor</p>
            </div>
          </Link>
          <Link href="/student/analysis">
            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-5 hover:from-purple-500 hover:to-purple-600 transition-all cursor-pointer">
              <div className="text-2xl mb-2">🔍</div>
              <h3 className="font-semibold">Game Analysis</h3>
              <p className="text-purple-200 text-sm mt-1">Analyse your games with AI feedback</p>
            </div>
          </Link>
          <Link href="/student/progress">
            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-5 hover:from-green-500 hover:to-green-600 transition-all cursor-pointer">
              <div className="text-2xl mb-2">📈</div>
              <h3 className="font-semibold">My Progress</h3>
              <p className="text-green-200 text-sm mt-1">Track rating and topic mastery</p>
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Stats */}
          {snapshot && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="font-semibold mb-4">This Month</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-2xl font-bold">{student?.rating}</p><p className="text-slate-400 text-sm">Rating</p></div>
                <div><p className="text-2xl font-bold">{snapshot.sessionCount}</p><p className="text-slate-400 text-sm">Sessions</p></div>
                <div><p className="text-2xl font-bold text-green-400">+{Math.round(snapshot.improvementRate)}%</p><p className="text-slate-400 text-sm">Improvement</p></div>
              </div>
            </div>
          )}

          {/* Plan progress */}
          {plan && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="font-semibold mb-4">Improvement Plan</h3>
              <div className="flex justify-between text-sm text-slate-400 mb-2">
                <span>Milestones</span>
                <span>{doneMilestones}/{milestones.length} done</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-4">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${milestones.length ? (doneMilestones / milestones.length * 100) : 0}%` }} />
              </div>
              <div className="space-y-1">
                {milestones.slice(0, 3).map((m, i) => (
                  <div key={i} className={`text-sm flex items-center gap-2 ${m.done ? "text-green-400" : "text-slate-400"}`}>
                    <span>{m.done ? "✓" : "○"}</span>{m.title}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI context */}
          {student?.context && (
            <div className="col-span-2 bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-500/20 rounded-xl p-5">
              <p className="text-xs text-blue-400 mb-1">✦ Your AI Mentor knows you</p>
              <p className="text-sm text-slate-300">{student.context.contextSummary}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
