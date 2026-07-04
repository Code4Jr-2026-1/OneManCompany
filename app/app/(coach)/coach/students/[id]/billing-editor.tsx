"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function BillingEditor({
  studentId,
  billingType,
  monthlyFee,
}: {
  studentId: string
  billingType: string
  monthlyFee: number | null
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [type, setType] = useState(billingType)
  const [fee, setFee] = useState(monthlyFee != null ? String(monthlyFee) : "")
  const [loading, setLoading] = useState(false)

  async function save() {
    setLoading(true)
    await fetch(`/api/coach/students/${studentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        billingType: type,
        monthlyFee: type === "monthly" && fee ? Number(fee) : null,
      }),
    })
    setLoading(false)
    setEditing(false)
    router.refresh()
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-2 mt-1">
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          className="border rounded-lg px-2 py-1 text-sm bg-background text-foreground"
        >
          <option value="hourly">Hourly</option>
          <option value="monthly">Flat Monthly Fee</option>
        </select>
        {type === "monthly" && (
          <input
            type="number"
            placeholder="₹ / month"
            value={fee}
            onChange={e => setFee(e.target.value)}
            className="border rounded-lg px-2 py-1 text-sm w-32"
          />
        )}
        <div className="flex gap-2">
          <button onClick={save} disabled={loading} className="text-blue-600 hover:underline text-xs">{loading ? "…" : "Save"}</button>
          <button onClick={() => { setEditing(false); setType(billingType); setFee(monthlyFee != null ? String(monthlyFee) : "") }} className="text-muted-foreground hover:underline text-xs">Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <button onClick={() => setEditing(true)} className="hover:underline text-xs text-blue-600">
      {billingType === "monthly" && monthlyFee ? `₹${monthlyFee.toLocaleString()}/mo ✎` : "Set ✎"}
    </button>
  )
}
