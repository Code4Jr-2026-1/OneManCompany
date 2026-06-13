import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { CoachNav } from "@/components/coach-nav"
import { BillingActions } from "./actions"

export default async function BillingPage() {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH") redirect("/login")
  const coach = await prisma.user.findUnique({ where: { email: session.user!.email! } })
  if (!coach) redirect("/login")

  const students = await prisma.student.findMany({
    where: { coachId: coach.id },
    include: { billingEntries: { orderBy: { month: "desc" }, take: 3 } },
    orderBy: { name: "asc" },
  })

  const currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const totalEarned = students.reduce((a, s) => a + s.billingEntries.reduce((b, e) => b + e.amount, 0), 0)
  const totalPending = students.reduce((a, s) => a + s.billingEntries.filter(e => !e.paid).reduce((b, e) => b + e.amount, 0), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <CoachNav coachName={coach.name ?? "Coach"} />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Billing & Hours</h1>
        <p className="text-gray-500 text-sm mb-6">Track sessions, hours, and payments per student</p>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Earned (All Time)", value: `₹${totalEarned.toLocaleString()}`, color: "green" },
            { label: "Pending Payment", value: `₹${totalPending.toLocaleString()}`, color: totalPending > 0 ? "orange" : "green" },
            { label: "Rate per Hour", value: `₹${(coach.hourlyRate ?? 500).toLocaleString()}`, color: "blue" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border p-5">
              <p className="text-xs text-gray-500 mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color === "green" ? "text-green-600" : s.color === "orange" ? "text-amber-600" : "text-blue-600"}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Per student */}
        <div className="space-y-4">
          {students.map(s => {
            const currentEntry = s.billingEntries.find(e => new Date(e.month).getMonth() === currentMonth.getMonth())
            return (
              <div key={s.id} className="bg-white rounded-xl border">
                <div className="px-6 py-4 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                      {s.name.split(" ").map(n => n[0]).join("").slice(0,2)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-400">Rate: ₹{(coach.hourlyRate ?? 500).toLocaleString()}/hr</p>
                    </div>
                  </div>
                  {currentEntry && !currentEntry.paid && (
                    <BillingActions entryId={currentEntry.id} amount={currentEntry.amount} />
                  )}
                </div>
                <div className="divide-y">
                  {s.billingEntries.length === 0 ? (
                    <p className="px-6 py-4 text-sm text-gray-400">No billing entries yet.</p>
                  ) : s.billingEntries.map(e => (
                    <div key={e.id} className="px-6 py-3 flex items-center gap-4">
                      <span className="text-sm text-gray-500 w-28">{new Date(e.month).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</span>
                      <span className="text-sm text-gray-700">{e.sessions} sessions · {e.hours}h</span>
                      <span className="text-sm font-semibold text-gray-900 ml-auto">₹{e.amount.toLocaleString()}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${e.paid ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                        {e.paid ? "✓ Paid" : "Pending"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
