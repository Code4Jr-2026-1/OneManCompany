"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { waLink } from "@/lib/invite"

interface Props {
  entryId: string | null
  paid: boolean
  amount: number
  sessions: number
  studentId: string
  month: string
  hours?: number
  groupClassId?: string | null
  studentName?: string
  studentPhone?: string | null
}

export function BillingRowActions({ entryId, paid, amount, sessions, studentId, month, hours = 0, groupClassId = null, studentName = "", studentPhone = null }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function markPaid() {
    setLoading(true)
    if (entryId) {
      await fetch(`/api/coach/billing/${entryId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paid: true }) })
    } else if (groupClassId) {
      await fetch(`/api/coach/group-classes/${groupClassId}/billing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, month, sessions }),
      })
    } else {
      await fetch(`/api/coach/billing/private`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, month, sessions, hours, amount }),
      })
    }
    setLoading(false)
    router.refresh()
  }

  async function markUnpaid() {
    if (!entryId) return
    setLoading(true)
    await fetch(`/api/coach/billing/${entryId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paid: false }) })
    setLoading(false)
    router.refresh()
  }

  if (sessions === 0 && amount === 0) {
    return <span className="text-xs text-muted-foreground">No sessions</span>
  }

  if (paid) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full whitespace-nowrap">✓ Paid</span>
        <button onClick={markUnpaid} disabled={loading} className="text-xs text-muted-foreground hover:text-foreground underline disabled:opacity-50">
          {loading ? "…" : "Undo"}
        </button>
      </div>
    )
  }

  const monthLabel = new Date(month).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
  const reminderMessage = `Hi ${studentName}, this is a friendly reminder that your chess coaching fee of ₹${amount.toLocaleString()} for ${monthLabel} is pending. Please make the payment when convenient. Thank you! 🙏`

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full whitespace-nowrap">Pending</span>
      <a href={waLink(studentPhone, reminderMessage)} target="_blank" rel="noopener noreferrer"
        className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-2.5 py-1 rounded-lg font-medium">
        💬 Remind
      </a>
      <button onClick={markPaid} disabled={loading} className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-2.5 py-1 rounded-lg font-medium disabled:opacity-50">
        {loading ? "…" : "Mark Paid"}
      </button>
    </div>
  )
}
