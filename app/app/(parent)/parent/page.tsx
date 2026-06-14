import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { SignOutButton } from "@/components/sign-out-button"
import { PayUpiButton } from "@/components/pay-upi-button"
import { monthBounds, privateAmount, groupAmount } from "@/lib/billing"
import { buildUpcomingItems } from "@/lib/schedule"

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
      coach: { select: { name: true, hourlyRate: true, upiId: true } },
      coachSessions: { select: { duration: true, date: true } },
      groupEnrollments: { where: { status: "ACTIVE" }, include: { groupClass: true } },
      billingEntries: { include: { groupClass: { select: { name: true } } }, orderBy: { month: "desc" } },
      scheduledSessions: { where: { scheduledAt: { gte: new Date() } }, orderBy: { scheduledAt: "asc" }, take: 5 },
    },
  }) : []

  const fmtDay = (d: Date) => new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })
  const fmtTime = (d: Date) => new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })

  const { monthStart, nextMonth } = monthBounds(new Date())

  // Compute live billing rows per child (current month + history)
  const billingByChild = new Map<string, {
    rows: { label: string; amount: number; paid: boolean; entryId: string | null }[]
    pendingTotal: number
    monthLabel: string
  }>()

  for (const child of children) {
    const hourlyRate = child.coach?.hourlyRate ?? 500
    const rows: { label: string; amount: number; paid: boolean; entryId: string | null }[] = []

    // Current month private
    const currentSessions = child.coachSessions.filter(s => s.date >= monthStart && s.date < nextMonth)
    const currentHours = currentSessions.reduce((a, s) => a + s.duration, 0) / 60
    const privateEntry = child.billingEntries.find(e => !e.groupClassId && e.month.getTime() === monthStart.getTime())
    const privateAmt = privateAmount(currentHours, hourlyRate)
    if (privateAmt > 0) rows.push({ label: "Private Lessons", amount: privateAmt, paid: privateEntry?.paid ?? false, entryId: privateEntry?.id ?? null })

    // Current month group classes
    for (const e of child.groupEnrollments) {
      const sessionsCount = await prisma.groupSession.count({
        where: { groupClassId: e.groupClassId, date: { gte: monthStart, lt: nextMonth } },
      })
      const amt = groupAmount(sessionsCount, e.groupClass.groupRate)
      if (amt > 0) {
        const entry = child.billingEntries.find(b => b.groupClassId === e.groupClassId && b.month.getTime() === monthStart.getTime())
        rows.push({ label: `Group: ${e.groupClass.name}`, amount: amt, paid: entry?.paid ?? false, entryId: entry?.id ?? null })
      }
    }

    // Historical unpaid entries
    const historicalUnpaid = child.billingEntries.filter(e => e.month.getTime() < monthStart.getTime() && !e.paid)
    for (const e of historicalUnpaid) {
      const label = e.groupClassId ? `Group: ${e.groupClass?.name ?? "—"}` : "Private Lessons"
      rows.push({ label: `${label} (${new Date(e.month).toLocaleDateString("en-IN", { month: "short", year: "numeric" })})`, amount: e.amount, paid: false, entryId: e.id })
    }

    const pendingTotal = rows.filter(r => !r.paid).reduce((a, r) => a + r.amount, 0)
    billingByChild.set(child.id, { rows, pendingTotal, monthLabel: monthStart.toLocaleDateString("en-IN", { month: "long", year: "numeric" }) })
  }

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

                {/* Upcoming sessions */}
                {(() => {
                  const upcoming = buildUpcomingItems({
                    scheduledSessions: child.scheduledSessions,
                    groupClasses: child.groupEnrollments.map(e => e.groupClass),
                  }).slice(0, 3)
                  if (upcoming.length === 0) return null
                  return (
                    <div className="px-6 pb-6">
                      <h3 className="font-semibold text-gray-900 mb-3">Upcoming Sessions</h3>
                      <div className="space-y-2">
                        {upcoming.map((item, i) => {
                          const isToday = item.date.toDateString() === new Date().toDateString()
                          return (
                            <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                              <div className="w-24 text-xs text-gray-500 flex-shrink-0">
                                <div>{isToday ? "Today" : fmtDay(item.date)}</div>
                                <div className="font-medium text-gray-700">{fmtTime(item.date)}</div>
                              </div>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${item.kind === "group" ? "bg-teal-100 text-teal-700" : "bg-blue-100 text-blue-700"}`}>
                                {item.kind === "group" ? "Group" : "Private"}
                              </span>
                              <span className="text-sm text-gray-700 flex-1">{item.kind === "group" ? item.name : "Private Lesson"} · {item.duration} min</span>
                              {item.meetingLink && (
                                <a href={item.meetingLink} target="_blank" rel="noopener noreferrer"
                                  className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">
                                  Join →
                                </a>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}

                {/* Billing */}
                {(() => {
                  const billing = billingByChild.get(child.id)!
                  if (billing.rows.length === 0) return null
                  return (
                    <div className="px-6 pb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">Billing — {billing.monthLabel}</h3>
                        <span className={`text-sm font-bold ${billing.pendingTotal > 0 ? "text-amber-600" : "text-green-600"}`}>
                          {billing.pendingTotal > 0 ? `₹${billing.pendingTotal.toLocaleString()} due` : "All paid ✓"}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {billing.rows.map((r, i) => (
                          <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                            <span className="text-sm text-gray-700 flex-1">{r.label}</span>
                            <span className="text-sm font-semibold text-gray-900">₹{r.amount.toLocaleString()}</span>
                            {r.paid ? (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ Paid</span>
                            ) : (
                              <>
                                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Pending</span>
                                <PayUpiButton
                                  upiId={child.coach?.upiId}
                                  payeeName={child.coach?.name ?? "Coach"}
                                  amount={r.amount}
                                  note={`${child.name} — ${r.label}`}
                                />
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}

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
