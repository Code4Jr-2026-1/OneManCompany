import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { monthBounds, privateAmount, groupAmount } from "@/lib/billing"
import { BillingTabs } from "./tabs"

export default async function BillingPage() {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH") redirect("/login")
  const coach = await prisma.user.findUnique({ where: { email: session.user!.email! } })
  if (!coach) redirect("/login")

  const now = new Date()
  const { monthStart, nextMonth } = monthBounds(now)
  const hourlyRate = coach.hourlyRate ?? 500

  // All billing entries (private + group) per student
  const students = await prisma.student.findMany({
    where: { coachId: coach.id },
    include: {
      billingEntries: {
        orderBy: { month: "desc" },
      },
    },
    orderBy: { name: "asc" },
  })

  // Group billing: for each active group class, get sessions this month and active enrollments
  const groupClasses = await prisma.groupClass.findMany({
    where: { coachId: coach.id, isActive: true },
    include: {
      enrollments: {
        where: { status: "ACTIVE" },
        include: { student: { select: { id: true, name: true, phone: true } } },
      },
      sessions: {
        where: { date: { gte: monthStart, lt: nextMonth } },
        select: { id: true },
      },
    },
    orderBy: { name: "asc" },
  })

  // For group billing entries (paid status, current month)
  const groupBillingEntries = await prisma.billingEntry.findMany({
    where: { groupClassId: { not: null }, month: monthStart },
  })

  // This month's private session hours per student (live)
  const sessionAgg = await prisma.coachSession.groupBy({
    by: ["studentId"],
    where: { studentId: { in: students.map(s => s.id) }, date: { gte: monthStart, lt: nextMonth } },
    _sum: { duration: true },
    _count: { _all: true },
  })
  const sessionMap = new Map(sessionAgg.map(a => [a.studentId, { sessions: a._count._all, hours: (a._sum.duration ?? 0) / 60 }]))

  // Live current-month private row per student
  const currentPrivateRows = students.map(s => {
    const agg = sessionMap.get(s.id) ?? { sessions: 0, hours: 0 }
    const amount = privateAmount(agg.hours, hourlyRate)
    const entry = s.billingEntries.find(e => !e.groupClassId && e.month.getTime() === monthStart.getTime())
    return {
      studentId: s.id,
      sessions: agg.sessions,
      hours: agg.hours,
      amount,
      paid: entry?.paid ?? false,
      paidAt: entry?.paidAt?.toISOString() ?? null,
      entryId: entry?.id ?? null,
    }
  })

  // Live current-month group rows per (student, groupClass)
  const currentGroupRows = groupClasses.flatMap(gc => gc.enrollments.map(e => {
    const entry = groupBillingEntries.find(b => b.studentId === e.student.id && b.groupClassId === gc.id)
    const amount = groupAmount(gc.sessions.length, gc.groupRate)
    return {
      studentId: e.student.id,
      groupClassId: gc.id,
      sessions: gc.sessions.length,
      amount,
      paid: entry?.paid ?? false,
      paidAt: entry?.paidAt?.toISOString() ?? null,
      entryId: entry?.id ?? null,
    }
  }))

  // Historical entries (months before the current one)
  const historicalEntries = students.flatMap(s =>
    s.billingEntries.filter(e => e.month.getTime() < monthStart.getTime()).map(e => ({ ...e, studentId: s.id }))
  )

  // Aggregates — reconciled across current-month live rows + historical stored entries
  const thisMonthEarnings =
    currentPrivateRows.reduce((a, r) => a + r.amount, 0) +
    currentGroupRows.reduce((a, r) => a + r.amount, 0)

  const collectedThisMonth =
    currentPrivateRows.filter(r => r.paid).reduce((a, r) => a + r.amount, 0) +
    currentGroupRows.filter(r => r.paid).reduce((a, r) => a + r.amount, 0)

  const outstandingCurrent =
    currentPrivateRows.filter(r => !r.paid).reduce((a, r) => a + r.amount, 0) +
    currentGroupRows.filter(r => !r.paid).reduce((a, r) => a + r.amount, 0)

  const outstandingPast = historicalEntries.filter(e => !e.paid).reduce((a, e) => a + e.amount, 0)
  const totalOutstanding = outstandingCurrent + outstandingPast

  const duesStudentIds = new Set<string>()
  currentPrivateRows.forEach(r => { if (!r.paid && r.amount > 0) duesStudentIds.add(r.studentId) })
  currentGroupRows.forEach(r => { if (!r.paid && r.amount > 0) duesStudentIds.add(r.studentId) })
  historicalEntries.forEach(e => { if (!e.paid) duesStudentIds.add(e.studentId) })
  const studentsWithDues = duesStudentIds.size

  const monthLabel = monthStart.toLocaleDateString("en-IN", { month: "long", year: "numeric" })

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Billing & Hours</h1>
        <p className="text-muted-foreground text-sm mb-6">Track sessions, hours, and payments</p>

        {/* This month's status */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{monthLabel}</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Billed This Month", value: `₹${thisMonthEarnings.toLocaleString()}`, color: "blue" },
              { label: "Collected This Month", value: `₹${collectedThisMonth.toLocaleString()}`, color: "green" },
              { label: "Pending This Month", value: `₹${outstandingCurrent.toLocaleString()}`, color: outstandingCurrent > 0 ? "orange" : "green" },
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
        </div>

        {/* All-time outstanding */}
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Overall</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Total Outstanding (All Time)", value: `₹${totalOutstanding.toLocaleString()}`, color: totalOutstanding > 0 ? "orange" : "green" },
              { label: "Students with Dues", value: `${studentsWithDues}`, color: studentsWithDues > 0 ? "orange" : "green" },
            ].map(s => (
              <div key={s.label} className="bg-card border border-border rounded-xl shadow-sm p-4">
                <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                <p className={`text-xl font-bold ${
                  s.color === "orange" ? "text-amber-600" :
                  s.color === "green" ? "text-green-600" :
                  "text-foreground"
                }`}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        <BillingTabs
          students={students.map(s => {
            const current = currentPrivateRows.find(r => r.studentId === s.id)!
            return {
              id: s.id,
              name: s.name,
              phone: s.phone,
              current: {
                sessions: current.sessions,
                hours: current.hours,
                amount: current.amount,
                paid: current.paid,
                entryId: current.entryId,
              },
              pastEntries: s.billingEntries
                .filter(e => !e.groupClassId && e.month.getTime() < monthStart.getTime())
                .slice(0, 3)
                .map(e => ({
                  id: e.id, month: e.month.toISOString(), sessions: e.sessions,
                  hours: e.hours, amount: e.amount, paid: e.paid,
                })),
            }
          })}
          hourlyRate={hourlyRate}
          coachUpiId={coach.upiId}
          coachName={coach.name ?? "Coach"}
          groupClasses={groupClasses.map(gc => ({
            id: gc.id,
            name: gc.name,
            groupRate: gc.groupRate,
            sessionsThisMonth: gc.sessions.length,
            enrollments: gc.enrollments.map(e => {
              const current = currentGroupRows.find(r => r.studentId === e.student.id && r.groupClassId === gc.id)!
              return {
                studentId: e.student.id,
                studentName: e.student.name,
                studentPhone: e.student.phone,
                current: {
                  sessions: current.sessions,
                  amount: current.amount,
                  paid: current.paid,
                  entryId: current.entryId,
                },
              }
            }),
          }))}
          currentMonth={monthStart.toISOString()}
        />
    </div>
  )
}
