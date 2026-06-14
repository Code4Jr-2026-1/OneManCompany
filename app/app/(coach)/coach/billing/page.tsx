import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { BillingTabs } from "./tabs"

export default async function BillingPage() {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH") redirect("/login")
  const coach = await prisma.user.findUnique({ where: { email: session.user!.email! } })
  if (!coach) redirect("/login")

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const nextMonth  = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  // Private billing
  const students = await prisma.student.findMany({
    where: { coachId: coach.id },
    include: {
      billingEntries: {
        where: { groupClassId: null },
        orderBy: { month: "desc" },
        take: 3,
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
        include: { student: { select: { id: true, name: true } } },
      },
      sessions: {
        where: { date: { gte: monthStart, lt: nextMonth } },
        select: { id: true },
      },
    },
    orderBy: { name: "asc" },
  })

  // For group billing entries (paid status)
  const groupBillingEntries = await prisma.billingEntry.findMany({
    where: {
      groupClassId: { not: null },
      month: monthStart,
    },
  })

  const totalPrivateEarned = students.reduce((a, s) => a + s.billingEntries.reduce((b, e) => b + e.amount, 0), 0)
  const totalPrivatePending = students.reduce((a, s) => a + s.billingEntries.filter(e => !e.paid).reduce((b, e) => b + e.amount, 0), 0)
  const totalGroupThisMonth = groupClasses.reduce((a, gc) => a + gc.sessions.length * gc.groupRate * gc.enrollments.length, 0)

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Billing & Hours</h1>
        <p className="text-muted-foreground text-sm mb-6">Track sessions, hours, and payments</p>

        {/* Summary */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Private — All Time", value: `₹${totalPrivateEarned.toLocaleString()}`, color: "blue" },
            { label: "Private — Pending", value: `₹${totalPrivatePending.toLocaleString()}`, color: totalPrivatePending > 0 ? "orange" : "green" },
            { label: "Group — This Month", value: `₹${totalGroupThisMonth.toLocaleString()}`, color: "teal" },
            { label: "Private Rate", value: `₹${(coach.hourlyRate ?? 500).toLocaleString()}/hr`, color: "gray" },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl shadow-sm p-4">
              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
              <p className={`text-xl font-bold ${
                s.color === "blue" ? "text-blue-600" :
                s.color === "orange" ? "text-amber-600" :
                s.color === "teal" ? "text-teal-600" :
                s.color === "green" ? "text-green-600" :
                "text-foreground"
              }`}>{s.value}</p>
            </div>
          ))}
        </div>

        <BillingTabs
          students={students.map(s => ({
            id: s.id,
            name: s.name,
            billingEntries: s.billingEntries.map(e => ({
              id: e.id, month: e.month.toISOString(), sessions: e.sessions,
              hours: e.hours, amount: e.amount, paid: e.paid,
            })),
          }))}
          hourlyRate={coach.hourlyRate ?? 500}
          groupClasses={groupClasses.map(gc => ({
            id: gc.id,
            name: gc.name,
            groupRate: gc.groupRate,
            sessionsThisMonth: gc.sessions.length,
            enrollments: gc.enrollments.map(e => ({
              studentId: e.student.id,
              studentName: e.student.name,
              paid: groupBillingEntries.find(b => b.studentId === e.student.id && b.groupClassId === gc.id)?.paid ?? false,
              paidAt: groupBillingEntries.find(b => b.studentId === e.student.id && b.groupClassId === gc.id)?.paidAt?.toISOString() ?? null,
              billingEntryId: groupBillingEntries.find(b => b.studentId === e.student.id && b.groupClassId === gc.id)?.id ?? null,
            })),
          }))}
          currentMonth={monthStart.toISOString()}
        />
    </div>
  )
}
