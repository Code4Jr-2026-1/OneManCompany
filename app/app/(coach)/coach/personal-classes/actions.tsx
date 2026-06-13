"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

type Student = { id: string; name: string; skillLevel: string }

function QuickBookModal({ students, onClose }: { students: Student[]; onClose: () => void }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const fd = new FormData(e.currentTarget)
    const res = await fetch("/api/coach/personal-classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: fd.get("studentId"),
        scheduledAt: fd.get("datetime"),
        duration: Number(fd.get("duration")),
      }),
    })
    setLoading(false)
    if (res.ok) { onClose(); router.refresh() }
    else { const d = await res.json(); setError(d.error || "Failed to book session") }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-96 shadow-xl" onClick={e => e.stopPropagation()}>
        <h2 className="font-bold text-gray-900 mb-4">Quick Book — Private Session</h2>
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">{error}</p>}
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Student</label>
            <select name="studentId" required className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">Select a student…</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Date & Time</label>
            <input name="datetime" type="datetime-local" required className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Duration</label>
            <select name="duration" className="w-full border rounded-lg px-3 py-2 text-sm">
              {[45, 60, 90, 120].map(d => <option key={d} value={d}>{d} min</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {loading ? "Booking…" : "Book Session"}
            </button>
            <button type="button" onClick={onClose} className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function LogSessionModal({ sessionId, studentName, defaultDuration, onClose }: { sessionId: string; studentName: string; defaultDuration: number; onClose: () => void }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    await fetch(`/api/coach/personal-classes/${sessionId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicsCovered: fd.get("topics"), coachNotes: fd.get("notes"), duration: Number(fd.get("duration")) }),
    })
    setLoading(false)
    onClose()
    router.refresh()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-[420px] shadow-xl" onClick={e => e.stopPropagation()}>
        <h2 className="font-bold text-gray-900 mb-1">Log Session — {studentName}</h2>
        <p className="text-sm text-gray-400 mb-4">This will mark the scheduled session as completed.</p>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Duration (min)</label>
            <select name="duration" defaultValue={defaultDuration} className="w-full border rounded-lg px-3 py-2 text-sm">
              {[30, 45, 60, 90, 120].map(d => <option key={d} value={d}>{d} min</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Topics Covered</label>
            <input name="topics" placeholder="e.g. Opening theory, tactics" className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Coach Notes</label>
            <textarea name="notes" rows={3} placeholder="Notes for this session…" className="w-full border rounded-lg px-3 py-2 text-sm resize-none" />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
              {loading ? "Saving…" : "Complete Session"}
            </button>
            <button type="button" onClick={onClose} className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function QuickBookButton({ students }: { students: Student[] }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
        + Quick Book
      </button>
      {open && <QuickBookModal students={students} onClose={() => setOpen(false)} />}
    </>
  )
}

export function QuickBookInline({ students }: { students: Student[] }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)} className="text-blue-600 hover:underline">Book one →</button>
      {open && <QuickBookModal students={students} onClose={() => setOpen(false)} />}
    </>
  )
}

export function LogSessionButton({ sessionId, studentName, defaultDuration }: { sessionId: string; studentName: string; defaultDuration: number }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)} className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-2.5 py-1.5 rounded-lg font-medium">
        Log
      </button>
      {open && <LogSessionModal sessionId={sessionId} studentName={studentName} defaultDuration={defaultDuration} onClose={() => setOpen(false)} />}
    </>
  )
}

export function AdHocLogButton({ students }: { students: Student[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const bookRes = await fetch("/api/coach/personal-classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: fd.get("studentId"), scheduledAt: fd.get("datetime"), duration: Number(fd.get("duration")) }),
    })
    if (bookRes.ok) {
      const booked = await bookRes.json()
      await fetch(`/api/coach/personal-classes/${booked.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicsCovered: fd.get("topics"), coachNotes: fd.get("notes"), duration: Number(fd.get("duration")) }),
      })
    }
    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  const now = new Date()
  const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)

  return (
    <>
      <button onClick={() => setOpen(true)} className="w-full text-sm border border-gray-200 hover:bg-gray-50 rounded-lg py-2 text-gray-700">
        + Log Ad-hoc Session
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-xl p-6 w-[420px] shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-gray-900 mb-4">Log Ad-hoc Session</h2>
            <form onSubmit={save} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Student</label>
                <select name="studentId" required className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">Select…</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Date & Time</label>
                <input name="datetime" type="datetime-local" required defaultValue={localNow} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Duration (min)</label>
                <select name="duration" className="w-full border rounded-lg px-3 py-2 text-sm">
                  {[30, 45, 60, 90, 120].map(d => <option key={d} value={d}>{d} min</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Topics</label>
                <input name="topics" placeholder="e.g. Opening, tactics" className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Notes</label>
                <textarea name="notes" rows={2} placeholder="Session notes…" className="w-full border rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={loading} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                  {loading ? "Saving…" : "Save Session"}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
