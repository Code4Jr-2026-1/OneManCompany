"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { waLink } from "@/lib/invite"
import { EmailInviteButton } from "@/components/email-invite-button"
import { DurationField } from "@/components/duration-field"

type Student = { id: string; name: string; skillLevel: string; phone: string | null; emails: string[] }

type BookedInvite = { studentName: string; phone: string | null; emails: string[]; message: string }

function QuickBookModal({ students, onClose }: { students: Student[]; onClose: () => void }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [invite, setInvite] = useState<BookedInvite | null>(null)

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const fd = new FormData(e.currentTarget)
    const studentId = fd.get("studentId") as string
    const datetime = fd.get("datetime") as string
    const duration = Number(fd.get("duration"))
    const res = await fetch("/api/coach/personal-classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, scheduledAt: datetime, duration }),
    })
    setLoading(false)
    if (res.ok) {
      const student = students.find(s => s.id === studentId)!
      const dt = new Date(datetime)
      const dateStr = dt.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })
      const timeStr = dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
      const message = `Hi ${student.name}! Your chess session is scheduled for ${dateStr} at ${timeStr} (${duration} min).`
      setInvite({ studentName: student.name, phone: student.phone, emails: student.emails, message })
      router.refresh()
    } else {
      const d = await res.json(); setError(d.error || "Failed to book session")
    }
  }

  function close() {
    setInvite(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={close}>
      <div className="bg-card rounded-xl p-6 w-96 shadow-xl" onClick={e => e.stopPropagation()}>
        {invite ? (
          <>
            <h2 className="font-bold text-foreground mb-1">Session Booked ✓</h2>
            <p className="text-sm text-muted-foreground mb-4">Private session with {invite.studentName}</p>
            <div className="space-y-2">
              <a href={waLink(invite.phone, invite.message)} target="_blank" rel="noopener noreferrer"
                className="block text-center bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700">
                Send WhatsApp Invite
              </a>
              <EmailInviteButton emails={invite.emails} subject="Chess Session Scheduled" body={invite.message}
                linkClassName="block text-center border py-2 rounded-lg text-sm font-medium hover:bg-accent" />
            </div>
            <button type="button" onClick={close} className="w-full mt-4 border px-4 py-2 rounded-lg text-sm hover:bg-accent">Done</button>
          </>
        ) : (
          <>
            <h2 className="font-bold text-foreground mb-4">Quick Book — Private Session</h2>
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">{error}</p>}
            <form onSubmit={save} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Student</label>
                <select name="studentId" required className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">Select a student…</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Date & Time</label>
                <input name="datetime" type="datetime-local" required className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <DurationField defaultValue={60} />
              <div className="flex gap-3">
                <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {loading ? "Booking…" : "Book Session"}
                </button>
                <button type="button" onClick={close} className="border px-4 py-2 rounded-lg text-sm hover:bg-accent">Cancel</button>
              </div>
            </form>
          </>
        )}
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
      <div className="bg-card rounded-xl p-6 w-[420px] shadow-xl" onClick={e => e.stopPropagation()}>
        <h2 className="font-bold text-foreground mb-1">Log Session — {studentName}</h2>
        <p className="text-sm text-muted-foreground mb-4">This will mark the scheduled session as completed.</p>
        <form onSubmit={save} className="space-y-4">
          <DurationField defaultValue={defaultDuration} />
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Topics Covered</label>
            <input name="topics" placeholder="e.g. Opening theory, tactics" className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Coach Notes</label>
            <textarea name="notes" rows={3} placeholder="Notes for this session…" className="w-full border rounded-lg px-3 py-2 text-sm resize-none" />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
              {loading ? "Saving…" : "Complete Session"}
            </button>
            <button type="button" onClick={onClose} className="border px-4 py-2 rounded-lg text-sm hover:bg-accent">Cancel</button>
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
      <button onClick={() => setOpen(true)} className="w-full text-sm border border-border hover:bg-accent rounded-lg py-2 text-foreground">
        + Log Ad-hoc Session
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setOpen(false)}>
          <div className="bg-card rounded-xl p-6 w-[420px] shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-foreground mb-4">Log Ad-hoc Session</h2>
            <form onSubmit={save} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Student</label>
                <select name="studentId" required className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">Select…</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Date & Time</label>
                <input name="datetime" type="datetime-local" required defaultValue={localNow} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <DurationField defaultValue={60} />
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Topics</label>
                <input name="topics" placeholder="e.g. Opening, tactics" className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Notes</label>
                <textarea name="notes" rows={2} placeholder="Session notes…" className="w-full border rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={loading} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                  {loading ? "Saving…" : "Save Session"}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="border px-4 py-2 rounded-lg text-sm hover:bg-accent">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
