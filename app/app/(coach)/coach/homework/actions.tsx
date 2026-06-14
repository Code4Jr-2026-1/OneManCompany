"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

type HwSuggestion = { title: string; description: string; estimatedMinutes: number }

export function HomeworkActions({ hwId }: { hwId: string }) {
  const router = useRouter()
  async function markDone() {
    await fetch(`/api/coach/homework/${hwId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "DONE" }),
    })
    router.refresh()
  }
  return (
    <button onClick={markDone} className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-lg font-medium">
      Mark Done
    </button>
  )
}

export function AddHomeworkButton({ studentId, studentName }: { studentId: string; studentName: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<HwSuggestion[]>([])
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  async function suggestHomework() {
    setSuggestLoading(true)
    setShowSuggestions(false)
    try {
      const res = await fetch("/api/coach/suggest-homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, topicsCovered: "", wellness: "good" }),
      })
      const data = await res.json()
      if (data.suggestions) { setSuggestions(data.suggestions); setShowSuggestions(true) }
    } catch { /* ignore */ }
    setSuggestLoading(false)
  }

  async function save() {
    if (!title.trim()) return
    setLoading(true)
    await fetch("/api/coach/homework/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, title, description, dueDate: dueDate || null }),
    })
    setLoading(false)
    setOpen(false)
    setTitle(""); setDescription(""); setDueDate("")
    setSuggestions([]); setShowSuggestions(false)
    router.refresh()
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-medium">
        + Add Homework
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setOpen(false)}>
          <div className="bg-card rounded-xl w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="font-bold text-foreground">Add Homework — {studentName}</h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-muted-foreground text-xl">×</button>
            </div>
            <div className="p-6 space-y-4">

              {/* AI Suggest */}
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-foreground">Homework task</p>
                <button type="button" onClick={suggestHomework} disabled={suggestLoading}
                  className="text-xs bg-purple-600 text-white hover:bg-purple-700 px-3 py-1.5 rounded-lg font-medium disabled:opacity-50 flex items-center gap-1.5">
                  {suggestLoading
                    ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Suggesting…</>
                    : "✦ AI Suggest"}
                </button>
              </div>

              {showSuggestions && suggestions.length > 0 && (
                <div className="border border-purple-200 rounded-xl bg-purple-50 p-3">
                  <p className="text-xs font-semibold text-purple-600 mb-2">✦ Tap a suggestion to use it:</p>
                  <div className="space-y-2">
                    {suggestions.map((s, i) => (
                      <button key={i} type="button"
                        onClick={() => { setTitle(s.title); setDescription(s.description); setShowSuggestions(false) }}
                        className="w-full text-left bg-card border border-purple-100 rounded-lg p-2.5 hover:border-purple-400 transition-colors">
                        <p className="text-sm font-medium text-foreground">{s.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">~{s.estimatedMinutes} min</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Homework title *"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Description / instructions (optional)"
                rows={3} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Due date (optional)</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={save} disabled={loading || !title.trim()}
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {loading ? "Saving…" : "Assign Homework"}
                </button>
                <button onClick={() => setOpen(false)} className="border px-5 py-2.5 rounded-lg text-sm hover:bg-accent">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
