"use client"
import { useState } from "react"

export function AiSummary({ studentName, skillLevel, rating, ratingChange, context, topicMastery, planTopics, recentSessions, homeworkDone, homeworkTotal, totalSessions }: {
  studentName: string; skillLevel: string; rating: number; ratingChange: number; context: string
  topicMastery: Record<string, number>; planTopics: string[]
  recentSessions: { date: string; topicsCovered: string | null; aiSummary: string | null }[]
  homeworkDone: number; homeworkTotal: number; totalSessions: number
}) {
  const [summary, setSummary] = useState("")
  const [loading, setLoading] = useState(false)

  function generate() {
    setLoading(true)
    fetch("/api/coach/student-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentName, skillLevel, rating, ratingChange, context, topicMastery, planTopics, recentSessions, homeworkDone, homeworkTotal, totalSessions }),
    }).then(r => r.json()).then(d => { setSummary(d.summary); setLoading(false) })
      .catch(() => { setSummary("Could not load AI summary. Check your API key."); setLoading(false) })
  }

  if (loading) return <div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div>

  if (!summary) {
    return <button onClick={generate} className="text-sm text-purple-600 border border-purple-200 rounded-lg px-3 py-1.5 hover:bg-purple-50">✦ Generate AI Summary</button>
  }

  return <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{summary}</p>
}
