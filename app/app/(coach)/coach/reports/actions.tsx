"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function ReportActions({ children }: { children?: React.ReactNode }) {
  return <>{children}</>
}

// ── Generate All ────────────────────────────────────────────────
type StudentResult = { name: string; aiUsed: boolean; error: string | null }

export function GenerateAllButton({ students }: { students: { id: string; name: string }[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [current, setCurrent] = useState<string | null>(null)
  const [results, setResults] = useState<StudentResult[]>([])
  const [done, setDone] = useState(false)

  async function run() {
    if (students.length === 0) return
    setLoading(true)
    setDone(false)
    setResults([])

    const collected: StudentResult[] = []

    for (let i = 0; i < students.length; i++) {
      const s = students[i]
      setCurrent(s.name)
      try {
        const res = await fetch("/api/coach/generate-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId: s.id }),
        })
        const data = await res.json()
        collected.push({ name: s.name, aiUsed: data.aiUsed ?? false, error: data.aiError ?? null })
      } catch (err) {
        collected.push({ name: s.name, aiUsed: false, error: String(err) })
      }
      setResults([...collected])
      if (i < students.length - 1) await new Promise(r => setTimeout(r, 1000))
    }

    setCurrent(null)
    setLoading(false)
    setDone(true)
    router.refresh()
  }

  if (done && results.length > 0) {
    const failed = results.filter(r => !r.aiUsed)
    return (
      <div className="text-right">
        <div className="text-xs space-y-0.5 mb-2">
          {results.map(r => (
            <div key={r.name} className={`flex items-center gap-1.5 justify-end ${r.aiUsed ? "text-green-600" : "text-amber-600"}`}>
              <span>{r.aiUsed ? "✓" : "⚠"}</span>
              <span>{r.name}</span>
              <span className="text-muted-foreground">{r.aiUsed ? "AI generated" : r.error ? `fallback (${r.error.slice(0, 40)})` : "fallback"}</span>
            </div>
          ))}
        </div>
        <button onClick={run}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
          {failed.length > 0 ? `↻ Retry ${failed.length} failed` : "✦ Regenerate All"}
        </button>
      </div>
    )
  }

  return (
    <button onClick={run} disabled={loading}
      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 min-w-[200px] justify-center">
      {loading ? (
        <>
          <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />
          {current ? `Generating ${current}…` : "Starting…"}
        </>
      ) : "✦ Generate All with AI"}
    </button>
  )
}

// ── Generate One ────────────────────────────────────────────────
export function GenerateOneButton({ studentId, studentName }: { studentId: string; studentName: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function run() {
    setLoading(true)
    await fetch("/api/coach/generate-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <button onClick={run} disabled={loading}
      className="text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 px-3 py-1.5 rounded-lg font-medium disabled:opacity-50">
      {loading ? "Generating…" : "✦ AI Generate"}
    </button>
  )
}

// ── Write Manually ──────────────────────────────────────────────
export function WriteManuallyButton({ studentId, studentName }: { studentId: string; studentName: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState("")

  async function save() {
    if (!content.trim()) return
    setLoading(true)
    await fetch("/api/coach/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, content }),
    })
    setLoading(false)
    setOpen(false)
    setContent("")
    router.refresh()
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="text-xs bg-secondary text-muted-foreground hover:bg-accent px-3 py-1.5 rounded-lg font-medium">
        ✏ Write Manually
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setOpen(false)}>
          <div className="bg-card rounded-xl w-full max-w-2xl shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="font-bold text-foreground">Write Report — {studentName}</h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-muted-foreground text-xl">×</button>
            </div>
            <div className="p-6">
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={12}
                placeholder={`Write your progress report for ${studentName} here…\n\nTip: Include what they worked on, what improved, areas to focus on, and any homework notes.`}
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
              />
              <div className="flex gap-3 mt-4">
                <button onClick={save} disabled={loading || !content.trim()}
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {loading ? "Saving…" : "Save as Draft"}
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

// ── Draft Card (full view + edit + approve + delete) ────────────
export function DraftCard({ reportId, studentId, studentName, content, month }: {
  reportId: string; studentId: string; studentName: string; content: string; month: string
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(content)
  const [loading, setLoading] = useState<"save" | "approve" | "delete" | null>(null)
  const [expanded, setExpanded] = useState(false)

  async function save() {
    setLoading("save")
    await fetch(`/api/coach/reports/${reportId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: draft }),
    })
    setLoading(null)
    setEditing(false)
    router.refresh()
  }

  async function approve() {
    setLoading("approve")
    await fetch(`/api/coach/reports/${reportId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "SENT" }),
    })
    setLoading(null)
    router.refresh()
  }

  async function del() {
    if (!confirm("Delete this draft?")) return
    setLoading("delete")
    await fetch(`/api/coach/reports/${reportId}`, { method: "DELETE" })
    setLoading(null)
    router.refresh()
  }

  async function regenerate() {
    setLoading("save")
    const res = await fetch("/api/coach/generate-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId }),
    })
    const data = await res.json()
    if (data.content) setDraft(data.content)
    setLoading(null)
    router.refresh()
  }

  const monthLabel = new Date(month).toLocaleDateString("en-IN", { month: "long", year: "numeric" })

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm border-amber-200">
      <div className="px-6 py-4 flex items-center justify-between border-b border-amber-100">
        <div>
          <span className="font-semibold text-foreground">{studentName}</span>
          <span className="text-muted-foreground text-sm ml-2">· {monthLabel}</span>
          <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Draft</span>
        </div>
        <div className="flex gap-2">
          <button onClick={regenerate} disabled={!!loading}
            className="text-xs text-purple-600 hover:text-purple-800 border border-purple-200 hover:bg-purple-50 px-2.5 py-1 rounded-lg disabled:opacity-40">
            {loading === "save" ? "…" : "✦ Regenerate"}
          </button>
          <button onClick={() => { setEditing(!editing); setExpanded(true) }}
            className="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 hover:bg-blue-50 px-2.5 py-1 rounded-lg">
            {editing ? "Cancel Edit" : "✏ Edit"}
          </button>
          <button onClick={approve} disabled={!!loading}
            className="text-xs bg-green-600 text-white hover:bg-green-700 px-3 py-1 rounded-lg font-medium disabled:opacity-50">
            {loading === "approve" ? "…" : "✓ Approve"}
          </button>
          <button onClick={del} disabled={!!loading}
            className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:bg-red-50 px-2.5 py-1 rounded-lg">
            {loading === "delete" ? "…" : "Delete"}
          </button>
        </div>
      </div>

      <div className="px-6 py-4">
        {editing ? (
          <>
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              rows={14}
              className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
            />
            <div className="flex gap-3 mt-3">
              <button onClick={save} disabled={!!loading}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {loading === "save" ? "Saving…" : "Save Changes"}
              </button>
              <button onClick={() => { setEditing(false); setDraft(content) }}
                className="border px-4 py-2 rounded-lg text-sm hover:bg-accent">Cancel</button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {expanded ? draft : draft.slice(0, 300) + (draft.length > 300 ? "…" : "")}
            </p>
            {draft.length > 300 && (
              <button onClick={() => setExpanded(!expanded)}
                className="text-xs text-blue-600 hover:underline mt-2">
                {expanded ? "Show less" : "Read full report"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Quick Edit (from history row) ───────────────────────────────
export function QuickEditButton({ reportId, content, studentName }: { reportId: string; content: string; studentName: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(content)
  const [loading, setLoading] = useState(false)

  async function save() {
    setLoading(true)
    await fetch(`/api/coach/reports/${reportId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: draft }),
    })
    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-xs text-blue-600 hover:underline flex-shrink-0">Edit</button>
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setOpen(false)}>
          <div className="bg-card rounded-xl w-full max-w-2xl shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="font-bold text-foreground">Edit Report — {studentName}</h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-muted-foreground text-xl">×</button>
            </div>
            <div className="p-6">
              <textarea value={draft} onChange={e => setDraft(e.target.value)} rows={14}
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono" />
              <div className="flex gap-3 mt-4">
                <button onClick={save} disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {loading ? "Saving…" : "Save Changes"}
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

