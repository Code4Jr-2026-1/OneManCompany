"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function EndSessionForm({ studentId, studentName, nextScheduled }: { studentId: string; studentName: string; nextScheduled: Date | null }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const defaultNext = nextScheduled
    ? new Date(nextScheduled).toISOString().split("T")[0]
    : new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    await fetch("/api/coach/end-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId,
        studentName,
        topicsCovered: fd.get("topics"),
        wellness: fd.get("wellness"),
        homeworkTasks: [fd.get("hw1"), fd.get("hw2")].filter(Boolean),
        nextSessionDate: fd.get("nextDate"),
        duration: Number(fd.get("duration")),
      }),
    })
    setDone(true)
    setLoading(false)
    setTimeout(() => router.push(`/coach/students/${studentId}`), 1500)
  }

  if (done) return (
    <div className="bg-white rounded-xl border p-8 text-center">
      <div className="text-5xl mb-4">✅</div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Session logged!</h2>
      <p className="text-gray-500">AI summary being generated… redirecting.</p>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border divide-y">
      <div className="p-5">
        <label className="block text-sm font-semibold text-gray-900 mb-3">1. What did you cover? <span className="text-red-500">*</span></label>
        <input name="topics" required placeholder="e.g. Italian Game opening, pin tactics, King & Pawn endgame"
          className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="p-5">
        <label className="block text-sm font-semibold text-gray-900 mb-3">2. Homework assigned</label>
        <input name="hw1" placeholder="Task 1 — e.g. 20 pin tactics on Lichess"
          className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2" />
        <input name="hw2" placeholder="Task 2 (optional)"
          className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="p-5 grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">3. Student energy today</label>
          <select name="wellness" className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="great">🔥 Great — very focused</option>
            <option value="good">👍 Good — normal session</option>
            <option value="ok">😐 OK — a bit distracted</option>
            <option value="low">😴 Low — tired or stressed</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">Session duration (min)</label>
          <input name="duration" type="number" defaultValue={60} min={15} max={180}
            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      <div className="p-5">
        <label className="block text-sm font-semibold text-gray-900 mb-3">4. Next session date</label>
        <input name="nextDate" type="date" defaultValue={defaultNext}
          className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="p-5">
        <button type="submit" disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 text-lg">
          {loading ? "Saving…" : "✓ Log Session"}
        </button>
      </div>
    </form>
  )
}
