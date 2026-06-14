"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function SettingsForm({ upiId, hourlyRate }: { upiId: string; hourlyRate: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setSaved(false)
    const fd = new FormData(e.currentTarget)
    await fetch("/api/coach/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        upiId: fd.get("upiId"),
        hourlyRate: Number(fd.get("hourlyRate") || 0),
      }),
    })
    setLoading(false)
    setSaved(true)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-5">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">UPI ID</label>
        <input name="upiId" defaultValue={upiId} placeholder="e.g. yourname@upi"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <p className="text-xs text-muted-foreground mt-1">Used to generate UPI QR codes / payment links for pending fees.</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Default Hourly Rate (₹)</label>
        <input name="hourlyRate" type="number" defaultValue={hourlyRate}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {loading ? "Saving…" : "Save"}
        </button>
        {saved && <span className="text-sm text-green-600">✓ Saved</span>}
      </div>
    </form>
  )
}
