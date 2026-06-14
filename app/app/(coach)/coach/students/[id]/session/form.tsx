"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function SessionForm({ studentId, studentName }: { studentId: string; studentName: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    await fetch("/api/coach/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, coachNotes: fd.get("notes"), wellness: fd.get("wellness") }),
    })
    setSaved(true)
    setLoading(false)
    setTimeout(() => router.push(`/coach/students/${studentId}`), 1000)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-5">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Session Notes</label>
        <textarea name="notes" rows={5} required placeholder={`What did you work on with ${studentName}?`}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Student Wellness (optional)</label>
        <select name="wellness" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Not recorded</option>
          <option value="great">Great — high energy and focus</option>
          <option value="good">Good — normal session</option>
          <option value="ok">OK — a bit distracted</option>
          <option value="low">Low — tired or stressed</option>
        </select>
      </div>
      {saved && <p className="text-green-600 text-sm font-medium">✓ Session saved!</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={loading || saved}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {loading ? "Saving…" : "Save Session"}
        </button>
        <button type="button" onClick={() => router.back()} className="border px-6 py-2 rounded-lg text-sm font-medium hover:bg-accent">Cancel</button>
      </div>
    </form>
  )
}
