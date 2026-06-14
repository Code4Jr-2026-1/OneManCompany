"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const SKILL_LEVELS = ["beginner", "intermediate", "advanced", "all"]

interface Props {
  classId: string
  className: string
  currentCapacity: number
  currentName: string
  currentDescription: string
  currentSkillLevel: string
  currentDayOfWeek: number
  currentStartTime: string
  currentDuration: number
  currentGroupRate: number
  currentMeetingLink: string
  currentWhatsappGroupLink: string
}

export function GroupClassActions(props: Props) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const fd = new FormData(e.currentTarget)
    const res = await fetch(`/api/coach/group-classes/${props.classId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        description: fd.get("description"),
        skillLevel: fd.get("skillLevel"),
        capacity: fd.get("capacity"),
        dayOfWeek: fd.get("dayOfWeek"),
        startTime: fd.get("startTime"),
        duration: fd.get("duration"),
        groupRate: fd.get("groupRate"),
        meetingLink: fd.get("meetingLink"),
        whatsappGroupLink: fd.get("whatsappGroupLink"),
      }),
    })
    setLoading(false)
    if (res.ok) { setEditOpen(false); router.refresh() }
    else { const d = await res.json(); setError(d.error || "Update failed") }
  }

  async function handleCancel() {
    setLoading(true)
    await fetch(`/api/coach/group-classes/${props.classId}`, { method: "DELETE" })
    setLoading(false)
    router.push("/coach/group-classes")
  }

  return (
    <>
      <div className="flex gap-2">
        <button onClick={() => setEditOpen(true)} className="border px-3 py-1.5 rounded-lg text-sm hover:bg-accent">Edit</button>
        <button onClick={() => setCancelOpen(true)} className="border border-red-200 text-red-600 px-3 py-1.5 rounded-lg text-sm hover:bg-red-50">Cancel Class</button>
      </div>

      {editOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditOpen(false)}>
          <div className="bg-card rounded-xl p-6 w-[480px] shadow-xl max-h-screen overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-foreground mb-4">Edit Group Class</h2>
            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Name</label>
                <input name="name" defaultValue={props.currentName} required className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Description</label>
                <textarea name="description" defaultValue={props.currentDescription} rows={2} className="w-full border rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Skill Level</label>
                  <select name="skillLevel" defaultValue={props.currentSkillLevel} className="w-full border rounded-lg px-3 py-2 text-sm">
                    {SKILL_LEVELS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Capacity</label>
                  <input name="capacity" type="number" min={1} defaultValue={props.currentCapacity} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Day</label>
                  <select name="dayOfWeek" defaultValue={props.currentDayOfWeek} className="w-full border rounded-lg px-3 py-2 text-sm">
                    {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Start Time</label>
                  <input name="startTime" type="time" defaultValue={props.currentStartTime} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Duration (min)</label>
                  <select name="duration" defaultValue={props.currentDuration} className="w-full border rounded-lg px-3 py-2 text-sm">
                    {[45, 60, 90, 120].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1">Rate (₹/session)</label>
                  <input name="groupRate" type="number" min={0} step={50} defaultValue={props.currentGroupRate} className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Meeting Link</label>
                <input name="meetingLink" type="url" defaultValue={props.currentMeetingLink} placeholder="https://meet.google.com/..." className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">WhatsApp Group Link</label>
                <input name="whatsappGroupLink" type="url" defaultValue={props.currentWhatsappGroupLink} placeholder="https://chat.whatsapp.com/..." className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={loading} className="flex-1 bg-teal-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50">
                  {loading ? "Saving…" : "Save Changes"}
                </button>
                <button type="button" onClick={() => setEditOpen(false)} className="border px-4 py-2 rounded-lg text-sm hover:bg-accent">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {cancelOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setCancelOpen(false)}>
          <div className="bg-card rounded-xl p-6 w-96 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-foreground mb-2">Cancel &quot;{props.className}&quot;?</h2>
            <p className="text-sm text-muted-foreground mb-5">All enrolled students will be removed. This cannot be undone. Sessions and billing history will be preserved.</p>
            <div className="flex gap-3">
              <button onClick={handleCancel} disabled={loading} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                {loading ? "Cancelling…" : "Yes, Cancel Class"}
              </button>
              <button onClick={() => setCancelOpen(false)} className="border px-4 py-2 rounded-lg text-sm hover:bg-accent">Keep</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export function EnrollButton({ classId, students }: { classId: string; students: { id: string; name: string }[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [studentId, setStudentId] = useState("")

  async function enroll() {
    if (!studentId) return
    setLoading(true)
    setError("")
    const res = await fetch(`/api/coach/group-classes/${classId}/enroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId }),
    })
    setLoading(false)
    if (res.ok) { setOpen(false); router.refresh() }
    else { const d = await res.json(); setError(d.error || "Failed") }
  }

  if (students.length === 0) return null

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-sm bg-teal-50 text-teal-700 hover:bg-teal-100 px-3 py-1.5 rounded-lg font-medium">
        + Enroll Student
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setOpen(false)}>
          <div className="bg-card rounded-xl p-6 w-80 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-foreground mb-4">Enroll Student</h3>
            {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
            <select value={studentId} onChange={e => setStudentId(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mb-4">
              <option value="">Select a student…</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <div className="flex gap-3">
              <button onClick={enroll} disabled={!studentId || loading} className="flex-1 bg-teal-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50">
                {loading ? "Enrolling…" : "Enroll"}
              </button>
              <button onClick={() => setOpen(false)} className="border px-4 py-2 rounded-lg text-sm hover:bg-accent">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export function DropButton({ classId, studentId, studentName }: { classId: string; studentId: string; studentName: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function drop() {
    if (!confirm(`Remove ${studentName} from this class?`)) return
    setLoading(true)
    await fetch(`/api/coach/group-classes/${classId}/enroll`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <button onClick={drop} disabled={loading} className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50">
      {loading ? "…" : "Drop"}
    </button>
  )
}

export function LogSessionButton({ classId }: { classId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hasHomework, setHasHomework] = useState(false)

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    await fetch(`/api/coach/group-classes/${classId}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: fd.get("date"),
        topicsCovered: fd.get("topicsCovered"),
        coachNotes: fd.get("coachNotes"),
        homework: hasHomework ? {
          title: fd.get("hwTitle"),
          description: fd.get("hwDescription"),
          dueDate: fd.get("hwDueDate"),
        } : null,
      }),
    })
    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  const today = new Date().toISOString().split("T")[0]

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-medium">
        + Log Session
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-8" onClick={() => setOpen(false)}>
          <div className="bg-card rounded-xl p-6 w-[480px] shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-foreground mb-4">Log Group Session</h3>
            <form onSubmit={save} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Date *</label>
                <input name="date" type="date" required defaultValue={today} className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Topics Covered</label>
                <input name="topicsCovered" placeholder="e.g. Ruy Lopez, endgame principles" className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Notes</label>
                <textarea name="coachNotes" rows={3} placeholder="Session notes…" className="w-full border rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={hasHomework} onChange={e => setHasHomework(e.target.checked)} className="rounded" />
                  <span className="text-sm font-medium text-foreground">Assign homework to all students</span>
                </label>
              </div>
              {hasHomework && (
                <div className="border rounded-lg p-4 space-y-3 bg-secondary">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Homework Title *</label>
                    <input name="hwTitle" required placeholder="e.g. Practise 10 tactics puzzles" className="w-full border rounded-lg px-3 py-2 text-sm bg-card" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Description</label>
                    <textarea name="hwDescription" rows={2} placeholder="Details…" className="w-full border rounded-lg px-3 py-2 text-sm resize-none bg-card" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1">Due Date</label>
                    <input name="hwDueDate" type="date" className="w-full border rounded-lg px-3 py-2 text-sm bg-card" />
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {loading ? "Saving…" : "Log Session"}
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
