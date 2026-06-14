"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const SKILL_LEVELS = ["beginner", "intermediate", "advanced", "all"]

export function NewGroupClassForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const fd = new FormData(e.currentTarget)
    const res = await fetch("/api/coach/group-classes", {
      method: "POST",
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
    if (res.ok) {
      const data = await res.json()
      router.push(`/coach/group-classes/${data.id}`)
    } else {
      const data = await res.json()
      setError(data.error || "Failed to create class")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-5">
      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</div>}

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Class Name *</label>
        <input name="name" required placeholder="e.g. Beginner Group · Saturday" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Description</label>
        <textarea name="description" rows={2} placeholder="Optional description" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Skill Level</label>
          <select name="skillLevel" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
            {SKILL_LEVELS.map(l => <option key={l} value={l} className="capitalize">{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Max Capacity *</label>
          <input name="capacity" type="number" min={1} max={50} defaultValue={10} required className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Day of Week *</label>
          <select name="dayOfWeek" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
            {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Start Time *</label>
          <input name="startTime" type="time" required defaultValue="10:00" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Duration (minutes) *</label>
          <select name="duration" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
            {[45, 60, 90, 120].map(d => <option key={d} value={d}>{d} min</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Rate per Student / Session (₹) *</label>
          <input name="groupRate" type="number" min={0} step={50} defaultValue={300} required className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Meeting Link <span className="text-muted-foreground font-normal">(optional)</span></label>
          <input name="meetingLink" type="url" placeholder="https://meet.google.com/..." className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">WhatsApp Group Link <span className="text-muted-foreground font-normal">(optional)</span></label>
          <input name="whatsappGroupLink" type="url" placeholder="https://chat.whatsapp.com/..." className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="flex-1 bg-teal-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50">
          {loading ? "Creating…" : "Create Group Class"}
        </button>
        <button type="button" onClick={() => router.back()} className="border px-5 py-2.5 rounded-lg text-sm hover:bg-accent">
          Cancel
        </button>
      </div>
    </form>
  )
}
