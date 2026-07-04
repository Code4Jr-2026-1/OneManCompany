import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { PortalNav } from "@/components/portal-nav"
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
      coachSessions: {
        orderBy: { date: "desc" },
        select: { duration: true, date: true, topicsCovered: true },
      },
      groupEnrollments: { where: { status: "ACTIVE" }, include: { groupClass: true } },
      billingEntries: { include: { groupClass: { select: { name: true } } }, orderBy: { month: "desc" } },
      scheduledSessions: { where: { scheduledAt: { gte: new Date() } }, orderBy: { scheduledAt: "asc" }, take: 5 },
    },
  }) : []

  const fmtDay = (d: Date) => new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })
  const fmtTime = (d: Date) => new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })

  const { monthStart, nextMonth } = monthBounds(new Date())

  const billingByChild = new Map<string, {
    rows: { label: string; amount: number; paid: boolean; entryId: string | null }[]
    pendingTotal: number
    monthLabel: string
  }>()

  for (const child of children) {
    const hourlyRate = child.coach?.hourlyRate ?? 500
    const rows: { label: string; amount: number; paid: boolean; entryId: string | null }[] = []

    const currentSessions = child.coachSessions.filter(s => s.date >= monthStart && s.date < nextMonth)
    const currentHours = currentSessions.reduce((a, s) => a + s.duration, 0) / 60
    const privateEntry = child.billingEntries.find(e => !e.groupClassId && e.month.getTime() === monthStart.getTime())
    const isFlat = (child as { billingType?: string }).billingType === "monthly"
    const flatFee = (child as { monthlyFee?: number | null }).monthlyFee
    const privateAmt = isFlat && flatFee ? flatFee : privateAmount(currentHours, hourlyRate)
    if (privateAmt > 0) rows.push({ label: isFlat ? "Monthly Fee" : "Private Lessons", amount: privateAmt, paid: privateEntry?.paid ?? false, entryId: privateEntry?.id ?? null })

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

    const historicalUnpaid = child.billingEntries.filter(e => e.month.getTime() < monthStart.getTime() && !e.paid)
    for (const e of historicalUnpaid) {
      const label = e.groupClassId ? `Group: ${e.groupClass?.name ?? "—"}` : "Private Lessons"
      rows.push({ label: `${label} (${new Date(e.month).toLocaleDateString("en-IN", { month: "short", year: "numeric" })})`, amount: e.amount, paid: false, entryId: e.id })
    }

    const pendingTotal = rows.filter(r => !r.paid).reduce((a, r) => a + r.amount, 0)
    billingByChild.set(child.id, { rows, pendingTotal, monthLabel: monthStart.toLocaleDateString("en-IN", { month: "long", year: "numeric" }) })
  }

  return (
    <div className="min-h-screen bg-background">
      <PortalNav title="Parent Portal" userName={user?.name} />

      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">My Children&apos;s Progress</h1>
        <p className="text-muted-foreground mb-8">Stay up to date with your child&apos;s chess journey</p>

        {children.length === 0 ? (
          <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center text-muted-foreground">
            No students linked to your account yet. Contact your coach to link your child.
          </div>
        ) : (
          children.map(child => {
            const [cur, prev] = child.snapshots
            const ratingChange = cur && prev ? cur.rating - prev.rating : 0
            const plan = child.plans[0]
            const milestones: { title: string; done: boolean }[] = plan ? JSON.parse(plan.milestones) : []

            // Sessions this month
            const sessionsThisMonth = child.coachSessions.filter(
              s => new Date(s.date) >= monthStart && new Date(s.date) < nextMonth
            ).length
            const monthlyTarget = 20

            // Last topic from most recent session
            const lastTopic = child.coachSessions[0]?.topicsCovered ?? null

            const billing = billingByChild.get(child.id)!
            const pendingTotal = billing?.pendingTotal ?? 0
            const allPaid = pendingTotal === 0 && (billing?.rows.length ?? 0) > 0

            const upcoming = buildUpcomingItems({
              scheduledSessions: child.scheduledSessions,
              groupClasses: child.groupEnrollments.map(e => e.groupClass),
            }).slice(0, 3)

            return (
              <div key={child.id} className="bg-card rounded-xl border border-border shadow-sm mb-6 overflow-hidden">
                {/* ── SUMMARY HERO ── */}
                <div className="p-6">
                  {/* Child identity */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg shrink-0">
                      {child.name.split(" ").map(n => n[0]).join("").slice(0,2)}
                    </div>
                    <div>
                      <h2 className="font-bold text-foreground text-lg leading-tight">{child.name}</h2>
                      <p className="text-muted-foreground text-sm capitalize">{child.skillLevel} · Rating {child.rating}</p>
                    </div>
                    {ratingChange !== 0 && (
                      <div className={`ml-auto text-xl font-bold ${ratingChange > 0 ? "text-green-600" : "text-red-500"}`}>
                        {ratingChange > 0 ? `+${ratingChange}` : ratingChange}
                      </div>
                    )}
                  </div>

                  {/* Three numbers hero */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {/* Classes this month */}
                    <div className="bg-secondary rounded-xl p-4 text-center">
                      <p className="text-3xl font-bold text-foreground leading-none mb-1">{sessionsThisMonth}</p>
                      <p className="text-xs text-muted-foreground">of {monthlyTarget} classes</p>
                    </div>

                    {/* Payment status */}
                    <div className={`rounded-xl p-4 text-center ${pendingTotal > 0 ? "bg-amber-50 border border-amber-200" : allPaid ? "bg-green-50 border border-green-200" : "bg-secondary"}`}>
                      {pendingTotal > 0 ? (
                        <>
                          <p className="text-xl font-bold text-amber-700 leading-none mb-1">₹{pendingTotal.toLocaleString()}</p>
                          <p className="text-xs text-amber-600">due</p>
                        </>
                      ) : allPaid ? (
                        <>
                          <p className="text-2xl font-bold text-green-600 leading-none mb-1">✓</p>
                          <p className="text-xs text-green-700">Paid</p>
                        </>
                      ) : (
                        <>
                          <p className="text-2xl font-bold text-muted-foreground leading-none mb-1">—</p>
                          <p className="text-xs text-muted-foreground">No billing</p>
                        </>
                      )}
                    </div>

                    {/* Last topic */}
                    <div className="bg-secondary rounded-xl p-4 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Last class</p>
                      <p className="text-sm font-semibold text-foreground leading-tight truncate">
                        {lastTopic ?? "—"}
                      </p>
                    </div>
                  </div>

                  {/* Pay button — stays in hero when pending */}
                  {pendingTotal > 0 && child.coach?.upiId && (
                    <PayUpiButton
                      upiId={child.coach.upiId}
                      payeeName={child.coach.name ?? "Coach"}
                      amount={pendingTotal}
                      note={`${child.name} — chess coaching`}
                    />
                  )}
                </div>

                {/* ── DETAILS (collapsed) ── */}
                <details className="border-t border-border">
                  <summary className="px-6 py-3 text-sm font-medium text-muted-foreground cursor-pointer hover:bg-accent select-none list-none flex items-center justify-between">
                    <span>See more</span>
                    <span className="text-xs">↓</span>
                  </summary>

                  <div className="px-6 pb-6 pt-4 space-y-6">
                    {/* This month stats */}
                    {cur && (
                      <div>
                        <h3 className="font-semibold text-foreground mb-3">This Month</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-muted-foreground">Sessions</span><span className="font-medium text-foreground">{cur.sessionCount}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Improvement Rate</span><span className="font-medium text-green-600">+{Math.round(cur.improvementRate)}%</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Rating</span><span className="font-medium text-foreground">{cur.rating}</span></div>
                        </div>
                        {child.goals && (
                          <div className="mt-3 p-3 bg-secondary rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Goal</p>
                            <p className="text-sm text-foreground">{child.goals}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Improvement plan */}
                    {plan && milestones.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-foreground mb-3">Improvement Plan</h3>
                        <div className="space-y-2">
                          {milestones.map((m, i) => (
                            <div key={i} className={`text-sm flex items-center gap-2 ${m.done ? "text-green-600" : "text-muted-foreground"}`}>
                              <span className="text-base">{m.done ? "✅" : "⭕"}</span>{m.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Upcoming sessions */}
                    {upcoming.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-foreground mb-3">Upcoming Sessions</h3>
                        <div className="space-y-2">
                          {upcoming.map((item, i) => {
                            const isToday = item.date.toDateString() === new Date().toDateString()
                            return (
                              <div key={i} className="flex items-center gap-3 bg-secondary rounded-lg p-3">
                                <div className="w-24 text-xs text-muted-foreground flex-shrink-0">
                                  <div>{isToday ? "Today" : fmtDay(item.date)}</div>
                                  <div className="font-medium text-foreground">{fmtTime(item.date)}</div>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${item.kind === "group" ? "bg-teal-100 text-teal-700" : "bg-blue-100 text-blue-700"}`}>
                                  {item.kind === "group" ? "Group" : "Private"}
                                </span>
                                <span className="text-sm text-foreground flex-1">{item.kind === "group" ? item.name : "Private Lesson"} · {item.duration} min</span>
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
                    )}

                    {/* Billing detail */}
                    {billing && billing.rows.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-foreground">Billing — {billing.monthLabel}</h3>
                          <span className={`text-sm font-bold ${billing.pendingTotal > 0 ? "text-amber-600" : "text-green-600"}`}>
                            {billing.pendingTotal > 0 ? `₹${billing.pendingTotal.toLocaleString()} due` : "All paid ✓"}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {billing.rows.map((r, i) => (
                            <div key={i} className="flex items-center gap-3 bg-secondary rounded-lg p-3">
                              <span className="text-sm text-foreground flex-1">{r.label}</span>
                              <span className="text-sm font-semibold text-foreground">₹{r.amount.toLocaleString()}</span>
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
                    )}

                    {/* Reports */}
                    {child.parentReports.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-foreground mb-3">Reports</h3>
                        <div className="space-y-2">
                          {child.parentReports.map(r => (
                            <div key={r.id} className="bg-secondary rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-medium text-foreground">{new Date(r.month).toLocaleDateString("en", { month: "long", year: "numeric" })} Report</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === "SENT" ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>{r.status}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">{r.content.slice(0, 200)}…</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </details>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
