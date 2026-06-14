"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function RatingEditor({ studentId, rating }: { studentId: string; rating: number }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(String(rating))
  const [loading, setLoading] = useState(false)

  async function save() {
    setLoading(true)
    await fetch(`/api/coach/students/${studentId}/rating`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: Number(value) }),
    })
    setLoading(false)
    setEditing(false)
    router.refresh()
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={e => setValue(e.target.value)}
          className="border rounded-lg px-2 py-1 text-sm w-20"
        />
        <button onClick={save} disabled={loading} className="text-blue-600 hover:underline text-xs">{loading ? "…" : "Save"}</button>
        <button onClick={() => { setEditing(false); setValue(String(rating)) }} className="text-muted-foreground hover:underline text-xs">Cancel</button>
      </div>
    )
  }

  return (
    <button onClick={() => setEditing(true)} className="hover:underline" title="Click to update this month's rating">
      ✎
    </button>
  )
}
