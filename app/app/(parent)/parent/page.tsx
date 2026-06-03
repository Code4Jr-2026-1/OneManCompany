import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { SignOutButton } from "@/components/sign-out-button"

export default async function ParentPortal() {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "PARENT") redirect("/login")

  const user = await prisma.user.findUnique({ where: { email: session.user!.email! } })
  const children = user ? await prisma.student.findMany({
    where: { parentId: user.id },
    include: {
      snapshots: { orderBy: { month: "desc" }, take: 2 },
      plans: { where: { isActive: true }, take: 1 },
      parentReports: { orderBy: { createdAt: "desc" }, take: 3 },
    },
  }) : []

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-bold">♟</div>
          <span className="font-semibold">Parent Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-500 text-sm">{user?.name}</span>
          <SignOutButton />
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">My Children&apos;s Progress</h1>
        <p className="text-gray-500 mb-8">Stay up to date with your child&apos;s chess journey</p>

        {children.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
            No students linked to your account yet. Contact your coach to link your child.
          </div>
        ) : (
          children.map(child => {
            const [cur, prev] = child.snapshots
            const ratingChange = cur && prev ? cur.rating - prev.rating : 0
            const plan = child.plans[0]
            const milestones: { title: string; done: boolean }[] = plan ? JSON.parse(plan.milestones) : []
            return (
              <div key={child.id} className="bg-white rounded-xl border mb-6">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                        {child.name.split(" ").map(n => n[0]).join("").slice(0,2)}
                      </div>
                      <div>
                        <h2 className="font-bold text-gray-900 text-lg">{child.name}</h2>
                        <p className="text-gray-500 text-sm capitalize">{child.skillLevel} · Rating: {child.rating}</p>
                      </div>
                    </div>
                    <div className={`text-2xl font-bold ${ratingChange > 0 ? "text-green-600" : ratingChange < 0 ? "text-red-500" : "text-gray-400"}`}>
                      {ratingChange > 0 ? `+${ratingChange}` : ratingChange === 0 ? "—" : ratingChange}
                    </div>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">This Month</h3>
                    <div className="space-y-2 text-sm">
                      {cur && <>
                        <div className="flex justify-between"><span className="text-gray-500">Sessions</span><span className="font-medium">{cur.sessionCount}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Improvement Rate</span><span className="font-medium text-green-600">+{Math.round(cur.improvementRate)}%</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Rating</span><span className="font-medium">{cur.rating}</span></div>
                      </>}
                    </div>
                    {child.goals && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Goal</p>
                        <p className="text-sm text-gray-700">{child.goals}</p>
                      </div>
                    )}
                  </div>

                  {plan && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Improvement Plan</h3>
                      <div className="space-y-2">
                        {milestones.map((m, i) => (
                          <div key={i} className={`text-sm flex items-center gap-2 ${m.done ? "text-green-600" : "text-gray-500"}`}>
                            <span className="text-base">{m.done ? "✅" : "⭕"}</span>{m.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {child.parentReports.length > 0 && (
                  <div className="px-6 pb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Reports</h3>
                    <div className="space-y-2">
                      {child.parentReports.map(r => (
                        <div key={r.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-sm font-medium">{new Date(r.month).toLocaleDateString("en", { month: "long", year: "numeric" })} Report</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === "SENT" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{r.status}</span>
                          </div>
                          <p className="text-sm text-gray-600">{r.content.slice(0, 200)}…</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
