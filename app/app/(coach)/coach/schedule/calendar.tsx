"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

type CalEvent = { id: string; studentId: string; studentName: string; scheduledAt: string; duration: number; status: string }

const COLORS = ["bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500", "bg-pink-500", "bg-teal-500"]

function getWeekDays(base: Date) {
  const start = new Date(base)
  start.setDate(start.getDate() - start.getDay() + 1)
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d })
}

export function AddSessionButton({ students }: { students: { id: string; name: string }[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    await fetch("/api/coach/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: fd.get("studentId"), scheduledAt: fd.get("datetime"), duration: Number(fd.get("duration")) }),
    })
    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
        + Schedule Session
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-xl p-6 w-96 shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-gray-900 mb-4">Schedule Session</h2>
            <form onSubmit={save} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Student</label>
                <select name="studentId" required className="w-full border rounded-lg px-3 py-2 text-sm">
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
                  <option value={45}>45 min</option>
                  <option value={60}>60 min</option>
                  <option value={90}>90 min</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {loading ? "Saving…" : "Schedule"}
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

export function WeekCalendar({ events }: { events: CalEvent[] }) {
  const [weekBase, setWeekBase] = useState(new Date())
  const days = getWeekDays(weekBase)
  const studentColors: Record<string, string> = {}
  let colorIdx = 0

  return (
    <div className="bg-white rounded-xl border">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <button onClick={() => { const d = new Date(weekBase); d.setDate(d.getDate() - 7); setWeekBase(d) }}
          className="text-gray-500 hover:text-gray-700 px-3 py-1 border rounded-lg text-sm">← Prev</button>
        <span className="font-semibold text-gray-900">
          {days[0].toLocaleDateString("en-IN", { day: "numeric", month: "short" })} — {days[6].toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </span>
        <button onClick={() => { const d = new Date(weekBase); d.setDate(d.getDate() + 7); setWeekBase(d) }}
          className="text-gray-500 hover:text-gray-700 px-3 py-1 border rounded-lg text-sm">Next →</button>
      </div>
      <div className="grid grid-cols-7 divide-x min-h-48">
        {days.map((day, i) => {
          const isToday = day.toDateString() === new Date().toDateString()
          const dayEvents = events.filter(e => new Date(e.scheduledAt).toDateString() === day.toDateString())
          return (
            <div key={i} className={`p-2 ${isToday ? "bg-blue-50" : ""}`}>
              <div className={`text-center mb-2 ${isToday ? "font-bold text-blue-600" : "text-gray-500"}`}>
                <div className="text-xs">{day.toLocaleDateString("en-IN", { weekday: "short" })}</div>
                <div className={`text-lg ${isToday ? "w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto text-sm" : ""}`}>
                  {day.getDate()}
                </div>
              </div>
              <div className="space-y-1">
                {dayEvents.map(ev => {
                  if (!studentColors[ev.studentId]) { studentColors[ev.studentId] = COLORS[colorIdx++ % COLORS.length] }
                  return (
                    <div key={ev.id} className={`${studentColors[ev.studentId]} text-white rounded px-1.5 py-1 text-xs`}>
                      <div className="font-medium truncate">{ev.studentName.split(" ")[0]}</div>
                      <div className="opacity-80">{new Date(ev.scheduledAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
