"use client"
import { useRouter } from "next/navigation"

export function BillingActions({ entryId, amount }: { entryId: string; amount: number }) {
  const router = useRouter()
  async function markPaid() {
    await fetch(`/api/coach/billing/${entryId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paid: true }) })
    router.refresh()
  }
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-semibold text-amber-600">₹{amount.toLocaleString()} due</span>
      <button onClick={markPaid} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 font-medium">Mark Paid</button>
    </div>
  )
}
