"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function EndSessionForm({ studentId, studentName, nextScheduled }: { studentId: string; studentName: string; nextScheduled: Date | null }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [aiResult, setAiResult] = useState<{ summary: string; keyMoments: string[]; studentPerformance: string; weaknessObserved: string; nextSessionFocus: string } | null>(null)

  const defaultNext = nextScheduled
    ? new Date(nextScheduled).toISOString().split("T")[0]
    : new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const res = await fetch("/api/coach/end-session", {
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
        transcript: fd.get("transcript"),
      }),
    })
    const data = await res.json()
    if (data.aiAnalysis) {
      try { setAiResult(JSON.parse(data.aiAnalysis)) } catch { /* ignore */ }
    }
    setDone(true)
    setLoading(false)
    setTimeout(() => router.push(`/coach/students/${studentId}`), data.aiAnalysis ? 6000 : 1500)
  }

  if (done && aiResult) return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-3xl">✅</div>
          <div>
            <h2 className="font-bold text-gray-900">Session logged!</h2>
            <p className="text-sm text-gray-400">AI has analysed the session — redirecting in 6s</p>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 mb-4">
          <p className="text-xs font-semibold text-purple-500 mb-2">✦ AI SESSION ANALYSIS</p>
          <p className="text-sm text-gray-800 leading-relaxed">{aiResult.summary}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {aiResult.studentPerformance && (
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-blue-500 mb-1">Performance</p>
              <p className="text-sm text-gray-700">{aiResult.studentPerformance}</p>
            </div>
          )}
          {aiResult.weaknessObserved && (
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-red-400 mb-1">Weakness spotted</p>
              <p className="text-sm text-gray-700">{aiResult.weaknessObserved}</p>
            </div>
          )}
          {aiResult.nextSessionFocus && (
            <div className="bg-green-50 rounded-lg p-3 col-span-2">
              <p className="text-xs font-semibold text-green-500 mb-1">Focus next session</p>
              <p className="text-sm text-gray-700">{aiResult.nextSessionFocus}</p>
            </div>
          )}
          {aiResult.keyMoments?.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 col-span-2">
              <p className="text-xs font-semibold text-gray-500 mb-2">Key moments</p>
              <ul className="space-y-1">
                {aiResult.keyMoments.map((m, i) => (
                  <li key={i} className="text-sm text-gray-700 flex gap-2"><span className="text-purple-400">•</span>{m}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )

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
        <label className="block text-sm font-semibold text-gray-900 mb-1">
          2. Session transcript / notes
          <span className="ml-2 text-xs font-normal text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">✦ AI analyses this</span>
        </label>
        <p className="text-xs text-gray-400 mb-2">Paste notes, key moments, what the student did well or struggled with. The more detail, the richer the AI analysis.</p>
        <textarea name="transcript" rows={5}
          placeholder="e.g. Student struggled with the pin on f6 in the opening. We spent 20 mins on tactical patterns — they got 7/10 puzzles. Showed them the Anastasia's mate pattern which they grasped quickly. Endgame was weak — blundered the rook in a simple R+K vs K position…"
          className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
      </div>

      <div className="p-5">
        <label className="block text-sm font-semibold text-gray-900 mb-3">3. Homework assigned</label>
        <input name="hw1" placeholder="Task 1 — e.g. 20 pin tactics on Lichess"
          className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2" />
        <input name="hw2" placeholder="Task 2 (optional)"
          className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="p-5 grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-3">4. Student energy today</label>
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
        <label className="block text-sm font-semibold text-gray-900 mb-3">5. Next session date</label>
        <input name="nextDate" type="date" defaultValue={defaultNext}
          className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="p-5">
        <button type="submit" disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 text-lg">
          {loading ? "Saving & analysing with AI…" : "✓ Log Session"}
        </button>
        <p className="text-center text-xs text-gray-400 mt-2">AI will analyse your transcript and generate insights instantly</p>
      </div>
    </form>
  )
}
