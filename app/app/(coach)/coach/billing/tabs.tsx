"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

type BillingEntry = { id: string; month: string; sessions: number; hours: number; amount: number; paid: boolean }
type StudentRow = { id: string; name: string; billingEntries: BillingEntry[] }
type GroupEnrollment = { studentId: string; studentName: string; paid: boolean; paidAt: string | null; billingEntryId: string | null }
type GroupClassRow = { id: string; name: string; groupRate: number; sessionsThisMonth: number; enrollments: GroupEnrollment[] }

interface Props {
  students: StudentRow[]
  hourlyRate: number
  groupClasses: GroupClassRow[]
  currentMonth: string
}

function MarkPaidButton({ entryId }: { entryId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  async function markPaid() {
    setLoading(true)
    await fetch(`/api/coach/billing/${entryId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paid: true }) })
    setLoading(false)
    router.refresh()
  }
  return (
    <button onClick={markPaid} disabled={loading} className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-2.5 py-1 rounded-lg font-medium disabled:opacity-50">
      {loading ? "…" : "Mark Paid"}
    </button>
  )
}

function GroupMarkPaidButton({ classId, studentId, month, sessions, currentPaid }: { classId: string; studentId: string; month: string; sessions: number; currentPaid: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  async function toggle() {
    setLoading(true)
    await fetch(`/api/coach/group-classes/${classId}/billing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, month, sessions }),
    })
    setLoading(false)
    router.refresh()
  }
  if (currentPaid) return <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full">✓ Paid</span>
  return (
    <button onClick={toggle} disabled={loading} className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-2.5 py-1 rounded-lg font-medium disabled:opacity-50">
      {loading ? "…" : "Mark Paid"}
    </button>
  )
}

export function BillingTabs({ students, hourlyRate, groupClasses, currentMonth }: Props) {
  const [tab, setTab] = useState<"private" | "group">("private")

  const currentMonthDate = new Date(currentMonth)

  return (
    <div>
      {/* Tab buttons */}
      <div className="flex gap-1 mb-5 bg-secondary rounded-lg p-1 w-fit">
        {(["private", "group"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}>
            {t === "private" ? "Private Lessons" : "Group Classes"}
          </button>
        ))}
      </div>

      {tab === "private" && (
        <div className="space-y-4">
          {students.map(s => {
            const currentEntry = s.billingEntries.find(e => new Date(e.month).getMonth() === currentMonthDate.getMonth())
            return (
              <div key={s.id} className="bg-card border border-border rounded-xl shadow-sm">
                <div className="px-6 py-4 border-b flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                      {s.name.split(" ").map(n => n[0]).join("").slice(0,2)}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{s.name}</p>
                      <p className="text-xs text-muted-foreground">Rate: ₹{hourlyRate.toLocaleString()}/hr</p>
                    </div>
                  </div>
                  {currentEntry && !currentEntry.paid && <MarkPaidButton entryId={currentEntry.id} />}
                </div>
                <div className="divide-y">
                  {s.billingEntries.length === 0 ? (
                    <p className="px-6 py-4 text-sm text-muted-foreground">No private billing entries yet.</p>
                  ) : s.billingEntries.map(e => (
                    <div key={e.id} className="px-6 py-3 flex items-center gap-4">
                      <span className="text-sm text-muted-foreground w-28">{new Date(e.month).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</span>
                      <span className="text-sm text-foreground">{e.sessions} sessions · {e.hours}h</span>
                      <span className="text-sm font-semibold text-foreground ml-auto">₹{e.amount.toLocaleString()}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${e.paid ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                        {e.paid ? "✓ Paid" : "Pending"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          {students.length === 0 && (
            <div className="bg-card border border-border rounded-xl shadow-sm px-6 py-12 text-center text-muted-foreground">No students yet.</div>
          )}
        </div>
      )}

      {tab === "group" && (
        <div className="space-y-6">
          {groupClasses.length === 0 && (
            <div className="bg-card border border-border rounded-xl shadow-sm px-6 py-12 text-center text-muted-foreground">
              No group classes yet. <a href="/coach/group-classes/new" className="text-teal-600 hover:underline">Create one →</a>
            </div>
          )}
          {groupClasses.map(gc => {
            const monthTotal = gc.sessionsThisMonth * gc.groupRate * gc.enrollments.length
            return (
              <div key={gc.id} className="bg-card border border-border rounded-xl shadow-sm">
                <div className="px-6 py-4 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{gc.name}</p>
                      <p className="text-xs text-muted-foreground">₹{gc.groupRate}/student/session · {gc.sessionsThisMonth} sessions this month</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-teal-700">₹{monthTotal.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">total this month</p>
                    </div>
                  </div>
                </div>
                {gc.enrollments.length === 0 ? (
                  <p className="px-6 py-4 text-sm text-muted-foreground">No enrolled students.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-muted-foreground uppercase border-b">
                        <th className="px-6 py-2 text-left">Student</th>
                        <th className="px-6 py-2 text-center">Sessions</th>
                        <th className="px-6 py-2 text-center">Rate</th>
                        <th className="px-6 py-2 text-right">Amount</th>
                        <th className="px-6 py-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {gc.enrollments.map(e => (
                        <tr key={e.studentId}>
                          <td className="px-6 py-3 font-medium text-foreground">{e.studentName}</td>
                          <td className="px-6 py-3 text-center text-muted-foreground">{gc.sessionsThisMonth}</td>
                          <td className="px-6 py-3 text-center text-muted-foreground">₹{gc.groupRate}</td>
                          <td className="px-6 py-3 text-right font-semibold text-foreground">₹{(gc.sessionsThisMonth * gc.groupRate).toLocaleString()}</td>
                          <td className="px-6 py-3 text-right">
                            <GroupMarkPaidButton
                              classId={gc.id}
                              studentId={e.studentId}
                              month={currentMonth}
                              sessions={gc.sessionsThisMonth}
                              currentPaid={e.paid}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
