"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

type HwSuggestion = { title: string; description: string; estimatedMinutes: number }

export function EndSessionForm({ studentId, studentName, nextScheduled }: {
  studentId: string; studentName: string; nextScheduled: Date | null
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiResult, setAiResult] = useState<{ summary: string; keyMoments: string[]; studentPerformance: string; weaknessObserved: string; nextSessionFocus: string } | null>(null)

  // Homework state
  const [hw1, setHw1] = useState("")
  const [hw2, setHw2] = useState("")
  const [suggestions, setSuggestions] = useState<HwSuggestion[]>([])
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Track topics + wellness for suggest-homework call
  const [topics, setTopics] = useState("")
  const [wellness, setWellness] = useState("good")

  const defaultNext = nextScheduled
    ? new Date(nextScheduled).toISOString().split("T")[0]
    : new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]

  async function suggestHomework() {
    setSuggestLoading(true)
    setShowSuggestions(false)
    try {
      const res = await fetch("/api/coach/suggest-homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, topicsCovered: topics, wellness }),
      })
      const data = await res.json()
      if (data.suggestions) {
        setSuggestions(data.suggestions)
        setShowSuggestions(true)
      }
    } catch { /* ignore */ }
    setSuggestLoading(false)
  }

  function pickSuggestion(s: HwSuggestion) {
    if (!hw1) { setHw1(s.title); return }
    if (!hw2) { setHw2(s.title); return }
    setHw1(s.title)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    try {
      const res = await fetch("/api/coach/end-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          studentName,
          topicsCovered: topics,
          wellness,
          homeworkTasks: [hw1, hw2].filter(Boolean),
          nextSessionDate: fd.get("nextDate"),
          duration: Number(fd.get("duration")),
          transcript: fd.get("transcript"),
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Server error ${res.status}: ${text.slice(0, 200)}`)
      }
      const data = await res.json()
      if (data.aiAnalysis) {
        try { setAiResult(JSON.parse(data.aiAnalysis)) } catch { /* ignore */ }
      }
      setDone(true)
      setTimeout(() => router.push(`/coach/students/${studentId}`), data.aiAnalysis ? 6000 : 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save session. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (done && aiResult) return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-3xl">✅</div>
          <div>
            <h2 className="font-bold text-foreground">Session logged!</h2>
            <p className="text-sm text-muted-foreground">Redirecting in 6s…</p>
          </div>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 mb-3">
          <p className="text-xs font-semibold text-purple-500 mb-2">✦ AI SESSION ANALYSIS</p>
          <p className="text-sm text-foreground leading-relaxed">{aiResult.summary}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {aiResult.studentPerformance && (
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-blue-500 mb-1">Performance</p>
              <p className="text-sm text-foreground">{aiResult.studentPerformance}</p>
            </div>
          )}
          {aiResult.weaknessObserved && (
            <div className="bg-red-50 rounded-lg p-3">
              <p className="text-xs font-semibold text-red-400 mb-1">Weakness spotted</p>
              <p className="text-sm text-foreground">{aiResult.weaknessObserved}</p>
            </div>
          )}
          {aiResult.nextSessionFocus && (
            <div className="bg-green-50 rounded-lg p-3 col-span-2">
              <p className="text-xs font-semibold text-green-500 mb-1">Focus next session</p>
              <p className="text-sm text-foreground">{aiResult.nextSessionFocus}</p>
            </div>
          )}
          {aiResult.keyMoments?.length > 0 && (
            <div className="bg-secondary rounded-lg p-3 col-span-2">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Key moments</p>
              <ul className="space-y-1">
                {aiResult.keyMoments.map((m, i) => (
                  <li key={i} className="text-sm text-foreground flex gap-2">
                    <span className="text-purple-400">•</span>{m}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  if (done) return (
    <div className="bg-card border border-border rounded-xl shadow-sm p-8 text-center">
      <div className="text-5xl mb-4">✅</div>
      <h2 className="text-xl font-bold text-foreground mb-2">Session logged!</h2>
      <p className="text-muted-foreground">Redirecting…</p>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl shadow-sm divide-y">

      {/* 1. Topics */}
      <div className="p-5">
        <label className="block text-sm font-semibold text-foreground mb-3">
          1. What did you cover? <span className="text-red-500">*</span>
        </label>
        <input
          value={topics}
          onChange={e => setTopics(e.target.value)}
          required
          placeholder="e.g. Italian Game opening, pin tactics, King & Pawn endgame"
          className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 2. Transcript */}
      <div className="p-5">
        <label className="block text-sm font-semibold text-foreground mb-1">
          2. Session transcript / notes
          <span className="ml-2 text-xs font-normal text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">✦ AI analyses this</span>
        </label>
        <p className="text-xs text-muted-foreground mb-2">Paste notes, key moments, what the student struggled with. More detail = richer AI analysis.</p>
        <textarea
          name="transcript"
          rows={4}
          placeholder="e.g. Student struggled with the pin on f6. Showed them Anastasia's mate — they grasped it quickly. Endgame was weak…"
          className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
        />
      </div>

      {/* 3. Homework with AI suggest */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-foreground">3. Homework assigned</label>
          <button
            type="button"
            onClick={suggestHomework}
            disabled={suggestLoading}
            className="text-xs bg-purple-600 text-white hover:bg-purple-700 px-3 py-1.5 rounded-lg font-medium disabled:opacity-50 flex items-center gap-1.5"
          >
            {suggestLoading ? (
              <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Suggesting…</>
            ) : "✦ AI Suggest"}
          </button>
        </div>

        {/* AI suggestions panel */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="mb-3 border border-purple-200 rounded-xl bg-purple-50 p-3">
            <p className="text-xs font-semibold text-purple-600 mb-2">✦ AI suggestions — tap to add:</p>
            <div className="space-y-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => pickSuggestion(s)}
                  className="w-full text-left bg-card border border-purple-100 rounded-lg p-2.5 hover:border-purple-400 hover:bg-purple-50 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{s.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                    </div>
                    <span className="text-xs text-purple-400 flex-shrink-0 mt-0.5">~{s.estimatedMinutes}m</span>
                  </div>
                  <p className="text-xs text-purple-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">+ Add to homework</p>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowSuggestions(false)}
              className="text-xs text-muted-foreground hover:text-muted-foreground mt-2"
            >
              Hide suggestions
            </button>
          </div>
        )}

        <input
          value={hw1}
          onChange={e => setHw1(e.target.value)}
          placeholder="Task 1 — e.g. 20 pin tactics on Lichess"
          className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
        />
        <input
          value={hw2}
          onChange={e => setHw2(e.target.value)}
          placeholder="Task 2 (optional)"
          className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* 4. Wellness + duration */}
      <div className="p-5 grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-3">4. Student energy today</label>
          <select
            value={wellness}
            onChange={e => setWellness(e.target.value)}
            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="great">🔥 Great — very focused</option>
            <option value="good">👍 Good — normal session</option>
            <option value="ok">😐 OK — a bit distracted</option>
            <option value="low">😴 Low — tired or stressed</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-foreground mb-3">Session duration (min)</label>
          <input
            name="duration"
            type="number"
            defaultValue={60}
            min={15}
            max={180}
            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 5. Next session */}
      <div className="p-5">
        <label className="block text-sm font-semibold text-foreground mb-3">5. Next session date</label>
        <input
          name="nextDate"
          type="date"
          defaultValue={defaultNext}
          className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Submit */}
      <div className="p-5">
        {error && (
          <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            ⚠ {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 text-lg"
        >
          {loading ? "Saving & analysing with AI…" : "✓ Log Session"}
        </button>
        <p className="text-center text-xs text-muted-foreground mt-2">
          AI will analyse your transcript and generate insights instantly
        </p>
      </div>
    </form>
  )
}
