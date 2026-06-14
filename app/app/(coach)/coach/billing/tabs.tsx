"use client"
import { useState } from "react"
import Link from "next/link"
import { BillingRowActions } from "@/components/billing-row-actions"

type CurrentRow = { sessions: number; hours: number; amount: number; paid: boolean; entryId: string | null }
type PastEntry = { id: string; month: string; sessions: number; hours: number; amount: number; paid: boolean }
type StudentRow = { id: string; name: string; phone: string | null; current: CurrentRow; pastEntries: PastEntry[] }

type GroupCurrentRow = { sessions: number; amount: number; paid: boolean; entryId: string | null }
type GroupEnrollment = { studentId: string; studentName: string; studentPhone: string | null; current: GroupCurrentRow }
type GroupClassRow = { id: string; name: string; groupRate: number; sessionsThisMonth: number; enrollments: GroupEnrollment[] }

interface Props {
  students: StudentRow[]
  hourlyRate: number
  groupClasses: GroupClassRow[]
  currentMonth: string
  coachUpiId: string | null
  coachName: string
}

export function BillingTabs({ students, hourlyRate, groupClasses, currentMonth, coachUpiId, coachName }: Props) {
  const [tab, setTab] = useState<"private" | "group">("private")

  const currentMonthLabel = new Date(currentMonth).toLocaleDateString("en-IN", { month: "long", year: "numeric" })

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
          {students.map(s => (
            <div key={s.id} className="bg-card border border-border rounded-xl shadow-sm">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <Link href={`/coach/billing/${s.id}`} className="flex items-center gap-3 hover:opacity-80">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                    {s.name.split(" ").map(n => n[0]).join("").slice(0,2)}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground hover:underline">{s.name}</p>
                    <p className="text-xs text-muted-foreground">Rate: ₹{hourlyRate.toLocaleString()}/hr</p>
                  </div>
                </Link>
              </div>
              <div className="divide-y">
                {/* Current month — live */}
                <div className="px-6 py-3 flex items-center gap-4 bg-blue-50/40">
                  <span className="text-sm font-medium text-foreground w-36">{currentMonthLabel}</span>
                  <span className="text-sm text-foreground">{s.current.sessions} session{s.current.sessions !== 1 ? "s" : ""} · {s.current.hours.toFixed(1)}h</span>
                  <span className="text-sm font-semibold text-foreground ml-auto">₹{s.current.amount.toLocaleString()}</span>
                  <BillingRowActions
                    entryId={s.current.entryId}
                    paid={s.current.paid}
                    amount={s.current.amount}
                    sessions={s.current.sessions}
                    hours={s.current.hours}
                    studentId={s.id}
                    month={currentMonth}
                    studentName={s.name}
                    studentPhone={s.phone}
                    coachUpiId={coachUpiId}
                    coachName={coachName}
                  />
                </div>
                {/* Past months — stored entries */}
                {s.pastEntries.map(e => (
                  <div key={e.id} className="px-6 py-3 flex items-center gap-4">
                    <span className="text-sm text-muted-foreground w-36">{new Date(e.month).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</span>
                    <span className="text-sm text-foreground">{e.sessions} session{e.sessions !== 1 ? "s" : ""} · {e.hours}h</span>
                    <span className="text-sm font-semibold text-foreground ml-auto">₹{e.amount.toLocaleString()}</span>
                    <BillingRowActions
                      entryId={e.id}
                      paid={e.paid}
                      amount={e.amount}
                      sessions={e.sessions}
                      hours={e.hours}
                      studentId={s.id}
                      month={e.month}
                      studentName={s.name}
                      studentPhone={s.phone}
                      coachUpiId={coachUpiId}
                      coachName={coachName}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
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
            const monthTotal = gc.enrollments.reduce((a, e) => a + e.current.amount, 0)
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
                          <td className="px-6 py-3 font-medium text-foreground">
                            <Link href={`/coach/billing/${e.studentId}`} className="hover:underline">{e.studentName}</Link>
                          </td>
                          <td className="px-6 py-3 text-center text-muted-foreground">{e.current.sessions}</td>
                          <td className="px-6 py-3 text-center text-muted-foreground">₹{gc.groupRate}</td>
                          <td className="px-6 py-3 text-right font-semibold text-foreground">₹{e.current.amount.toLocaleString()}</td>
                          <td className="px-6 py-3 text-right">
                            <div className="flex justify-end">
                              <BillingRowActions
                                entryId={e.current.entryId}
                                paid={e.current.paid}
                                amount={e.current.amount}
                                sessions={e.current.sessions}
                                studentId={e.studentId}
                                month={currentMonth}
                                groupClassId={gc.id}
                                studentName={e.studentName}
                                studentPhone={e.studentPhone}
                                coachUpiId={coachUpiId}
                                coachName={coachName}
                              />
                            </div>
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
