"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function PhoneEditor({ studentId, phone }: { studentId: string; phone: string | null }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(phone ?? "")
  const [loading, setLoading] = useState(false)

  async function save() {
    setLoading(true)
    await fetch(`/api/coach/students/${studentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: value || null }),
    })
    setLoading(false)
    setEditing(false)
    router.refresh()
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="e.g. 919876543210"
          className="border rounded-lg px-2 py-1 text-sm w-32"
        />
        <button onClick={save} disabled={loading} className="text-blue-600 hover:underline">{loading ? "…" : "Save"}</button>
        <button onClick={() => { setEditing(false); setValue(phone ?? "") }} className="text-muted-foreground hover:underline">Cancel</button>
      </div>
    )
  }

  return (
    <button onClick={() => setEditing(true)} className="font-semibold hover:underline">
      {phone || "Add WhatsApp number"}
    </button>
  )
}
