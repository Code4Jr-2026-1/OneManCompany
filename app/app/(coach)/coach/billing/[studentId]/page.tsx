import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { monthBounds, privateAmount, groupAmount } from "@/lib/billing"
import { BillingRowActions } from "@/components/billing-row-actions"

export default async function StudentBillingPage({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH") redirect("/login")
  const coach = await prisma.user.findUnique({ where: { email: session.user!.email! } })
  if (!coach) redirect("/login")

  const now = new Date()
  const { monthStart, nextMonth } = monthBounds(now)
  const hourlyRate = coach.hourlyRate ?? 500

  const student = await prisma.student.findUnique({
    where: { id: studentId, coachId: coach.id },
    include: {
      coachSessions: { select: { id: true, duration: true, date: true } },
      billingEntries: {
        include: { groupClass: { select: { name: true } } },
        orderBy: { month: "desc" },
      },
      groupEnrollments: { where: { status: "ACTIVE" }, include: { groupClass: true } },
    },
  })
  if (!student) notFound()

  // Live current-month private row
  const currentSessions = student.coachSessions.filter(s => s.date >= monthStart && s.date < nextMonth)
  const currentHours = currentSessions.reduce((a, s) => a + s.duration, 0) / 60
  const currentPrivateEntry = student.billingEntries.find(e => !e.groupClassId && e.month.getTime() === monthStart.getTime())
  const currentPrivateRow = {
    label: "Private",
    sessions: currentSessions.length,
    hours: currentHours,
    amount: privateAmount(currentHours, hourlyRate),
    paid: currentPrivateEntry?.paid ?? false,
    entryId: currentPrivateEntry?.id ?? null,
    groupClassId: null as string | null,
  }

  // Live current-month group rows
  const currentGroupRows = await Promise.all(student.groupEnrollments.map(async e => {
    const sessionsCount = await prisma.groupSession.count({
      where: { groupClassId: e.groupClassId, date: { gte: monthStart, lt: nextMonth } },
    })
    const entry = student.billingEntries.find(b => b.groupClassId === e.groupClassId && b.month.getTime() === monthStart.getTime())
    return {
      label: `Group: ${e.groupClass.name}`,
      sessions: sessionsCount,
      hours: 0,
      amount: groupAmount(sessionsCount, e.groupClass.groupRate),
      paid: entry?.paid ?? false,
      entryId: entry?.id ?? null,
      groupClassId: e.groupClassId,
    }
  }))

  const currentRows = [currentPrivateRow, ...currentGroupRows]
  const historicalEntries = student.billingEntries.filter(e => e.month.getTime() < monthStart.getTime())

  const totalBilled = currentRows.reduce((a, r) => a + r.amount, 0) + historicalEntries.reduce((a, e) => a + e.amount, 0)
  const totalPaid = currentRows.filter(r => r.paid).reduce((a, r) => a + r.amount, 0) + historicalEntries.filter(e => e.paid).reduce((a, e) => a + e.amount, 0)
  const pendingBalance = totalBilled - totalPaid

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center gap-2 mb-1 text-sm text-muted-foreground">
        <Link href="/coach/billing" className="hover:underline">Billing & Hours</Link>
        <span>/</span>
        <span className="text-foreground font-medium">{student.name}</span>
      </div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">{student.name} — Billing</h1>
        <Link href={`/coach/students/${student.id}`} className="text-sm text-blue-600 hover:underline">View Profile →</Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Sessions Attended", value: student.coachSessions.length.toLocaleString(), color: "gray" },
          { label: "Total Billed", value: `₹${totalBilled.toLocaleString()}`, color: "blue" },
          { label: "Total Paid", value: `₹${totalPaid.toLocaleString()}`, color: "green" },
          { label: "Pending Balance", value: `₹${pendingBalance.toLocaleString()}`, color: pendingBalance > 0 ? "orange" : "green" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl shadow-sm p-4">
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${
              s.color === "blue" ? "text-blue-600" :
              s.color === "orange" ? "text-amber-600" :
              s.color === "green" ? "text-green-600" :
              "text-foreground"
            }`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Invoices */}
      <div className="bg-card border border-border rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold text-foreground">Invoices</h2>
        </div>
        <div className="divide-y">
          {/* Current month — live */}
          {currentRows.map((r, i) => (
            <div key={`current-${i}`} className="px-6 py-3 flex items-center gap-4 bg-blue-50/40">
              <span className="text-sm font-medium text-foreground w-36 flex-shrink-0">
                {monthStart.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${r.groupClassId ? "bg-teal-100 text-teal-700" : "bg-blue-100 text-blue-700"}`}>
                {r.label}
              </span>
              <span className="text-sm text-foreground">
                {r.sessions} session{r.sessions !== 1 ? "s" : ""}{r.groupClassId ? "" : ` · ${r.hours.toFixed(1)}h`}
              </span>
              <span className="text-sm font-semibold text-foreground ml-auto">₹{r.amount.toLocaleString()}</span>
              <BillingRowActions
                entryId={r.entryId}
                paid={r.paid}
                amount={r.amount}
                sessions={r.sessions}
                hours={r.hours}
                studentId={student.id}
                month={monthStart.toISOString()}
                groupClassId={r.groupClassId}
                studentName={student.name}
                studentPhone={student.phone}
              />
            </div>
          ))}

          {/* Past months — stored entries */}
          {historicalEntries.length === 0 && currentRows.every(r => r.sessions === 0) ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">No billing history yet.</p>
          ) : historicalEntries.map(e => (
            <div key={e.id} className="px-6 py-3 flex items-center gap-4">
              <span className="text-sm text-muted-foreground w-36 flex-shrink-0">
                {new Date(e.month).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${e.groupClassId ? "bg-teal-100 text-teal-700" : "bg-blue-100 text-blue-700"}`}>
                {e.groupClassId ? `Group: ${e.groupClass?.name ?? "—"}` : "Private"}
              </span>
              <span className="text-sm text-foreground">
                {e.sessions} session{e.sessions !== 1 ? "s" : ""}{e.groupClassId ? "" : ` · ${e.hours}h`}
              </span>
              <span className="text-sm font-semibold text-foreground ml-auto">₹{e.amount.toLocaleString()}</span>
              <BillingRowActions
                entryId={e.id}
                paid={e.paid}
                amount={e.amount}
                sessions={e.sessions}
                hours={e.hours}
                studentId={student.id}
                month={e.month.toISOString()}
                groupClassId={e.groupClassId}
                studentName={student.name}
                studentPhone={student.phone}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
