"use client"
import { useState } from "react"
import { waLink } from "@/lib/invite"

const TOPIC_CHIPS = ["Tactics", "Endgame", "Openings", "Middlegame", "Strategy"]

type Student = { id: string; name: string; phone?: string | null }

type AttendanceResult = {
  updated: boolean
  sessionCounts: Record<string, number>
}

export function AttendanceForm({
  classType,
  classId,
  date,
  students,
}: {
  classType: "private" | "group"
  classId: string
  date: string
  students: Student[]
}) {
  const [present, setPresent] = useState<Record<string, boolean>>(
    Object.fromEntries(students.map(s => [s.id, true]))
  )
  const [topic, setTopic] = useState("")
  const [customTopic, setCustomTopic] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "updated">("idle")
  const [result, setResult] = useState<AttendanceResult | null>(null)

  const effectiveTopic = topic || customTopic

  function toggleStudent(id: string) {
    setPresent(prev => ({ ...prev, [id]: !prev[id] }))
  }

  async function handleSubmit() {
    setStatus("loading")
    const attendees = students.map(s => ({ studentId: s.id, present: present[s.id] ?? true, topic: effectiveTopic || undefined }))
    const res = await fetch("/api/coach/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classType, classId, date, attendees }),
    })
    const data: AttendanceResult = await res.json()
    setResult(data)
    setStatus(data.updated ? "updated" : "done")
  }

  const attendingStudents = students.filter(s => present[s.id])

  if (status === "done" || status === "updated") {
    return (
      <div className="space-y-6">
        {/* Confirmation banner */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-center gap-3">
          <span className="text-2xl">✓</span>
          <div>
            <p className="font-semibold text-green-800">{status === "updated" ? "Updated ✓" : "Done ✓"}</p>
            <p className="text-sm text-green-700">
              {attendingStudents.length} student{attendingStudents.length !== 1 ? "s" : ""} marked present
              {effectiveTopic ? ` · Topic: ${effectiveTopic}` : ""}
            </p>
          </div>
        </div>

        {/* WhatsApp links */}
        {attendingStudents.some(s => s.phone) && (
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-1">Notify Parents</h3>
            <p className="text-sm text-muted-foreground mb-4">Tap to send via WhatsApp</p>
            <div className="space-y-3">
              {attendingStudents.filter(s => s.phone).map(s => {
                const count = result?.sessionCounts[s.id] ?? 1
                const msg = [
                  `Hi! Class ${count}/20 done this month for ${s.name}.`,
                  effectiveTopic ? `Topic: ${effectiveTopic}.` : "",
                ].filter(Boolean).join(" ")
                return (
                  <a
                    key={s.id}
                    href={waLink(s.phone, msg)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3 hover:bg-green-100 transition-colors"
                  >
                    <span className="text-xl">💬</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm">{s.name}</p>
                      <p className="text-xs text-muted-foreground truncate">Class {count} · {effectiveTopic || "no topic"}</p>
                    </div>
                    <span className="text-green-700 text-sm font-medium shrink-0">Send →</span>
                  </a>
                )
              })}
            </div>
          </div>
        )}

        <a href="/coach" className="block w-full text-center bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700">
          Back to Today
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Topic selection */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-foreground mb-3">Topic Covered</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {TOPIC_CHIPS.map(chip => (
            <button
              key={chip}
              onClick={() => { setTopic(topic === chip ? "" : chip); setCustomTopic("") }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                topic === chip
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-card text-foreground border-border hover:bg-accent"
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Or type a custom topic…"
          value={customTopic}
          onChange={e => { setCustomTopic(e.target.value); setTopic("") }}
          className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Student attendance */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-semibold text-foreground mb-3">Attendance</h3>
        <div className="space-y-2">
          {students.map(s => (
            <div key={s.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
                  {s.name.split(" ").map(n => n[0]).join("").slice(0,2)}
                </div>
                <span className="text-sm font-medium text-foreground">{s.name}</span>
              </div>
              <button
                onClick={() => toggleStudent(s.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  present[s.id]
                    ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                    : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                }`}
              >
                {present[s.id] ? "✓ Present" : "✗ Absent"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={status === "loading"}
        className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold text-base hover:bg-green-700 disabled:opacity-60 transition-all"
      >
        {status === "loading" ? "Saving…" : `Mark ${attendingStudents.length} Present ✓`}
      </button>
    </div>
  )
}
