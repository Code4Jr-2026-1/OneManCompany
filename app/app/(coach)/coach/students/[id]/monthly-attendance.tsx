"use client"
import { useState } from "react"

type SessionRow = { id: string; date: string; duration: number; topicsCovered: string | null; coachNotes: string | null; aiSummary: string | null; homeworkSet: string | null }
type MonthBucket = { key: string; label: string; count: number; sessions: SessionRow[] }

export function MonthlyAttendance({ months, totalSessions }: { months: MonthBucket[]; totalSessions: number }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const max = Math.max(1, ...months.map(m => m.count))

  return (
    <div>
      <div className="flex items-end gap-3 h-24 mb-2">
        {months.map(m => (
          <button key={m.key} onClick={() => setExpanded(expanded === m.key ? null : m.key)}
            className="flex-1 flex flex-col items-center justify-end h-full group">
            <span className="text-xs font-semibold text-foreground mb-1">{m.count}</span>
            <div className={`w-full rounded-t-md transition-colors ${expanded === m.key ? "bg-blue-600" : "bg-blue-200 group-hover:bg-blue-300"}`}
              style={{ height: `${(m.count / max) * 100}%`, minHeight: m.count > 0 ? "4px" : "2px" }} />
          </button>
        ))}
      </div>
      <div className="flex gap-3 mb-3">
        {months.map(m => (
          <span key={m.key} className="flex-1 text-center text-xs text-muted-foreground">{m.label}</span>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mb-3">{totalSessions} session{totalSessions !== 1 ? "s" : ""} completed total</p>

      {expanded && (
        <div className="border-t pt-3 space-y-3">
          {(() => {
            const month = months.find(m => m.key === expanded)!
            if (month.sessions.length === 0) return <p className="text-sm text-muted-foreground">No sessions in {month.label}.</p>
            return month.sessions.map(s => (
              <div key={s.id} className="border-l-2 border-blue-200 pl-3 text-sm">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{new Date(s.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</span>
                  <span>{s.duration} min</span>
                </div>
                {s.topicsCovered && <p className="text-foreground font-medium">{s.topicsCovered}</p>}
                {s.coachNotes && <p className="text-muted-foreground">{s.coachNotes}</p>}
                {s.aiSummary && <p className="text-xs text-purple-600 mt-0.5">✦ {s.aiSummary}</p>}
                {s.homeworkSet && <p className="text-xs text-orange-600 mt-0.5">HW: {s.homeworkSet}</p>}
              </div>
            ))
          })()}
        </div>
      )}
    </div>
  )
}
