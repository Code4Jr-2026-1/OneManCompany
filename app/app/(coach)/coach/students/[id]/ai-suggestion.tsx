"use client"
import { useState } from "react"

export function AiSuggestion({ studentName, skillLevel, context, weakestTopic, nextPlanTopic, lastSessionTopic }: {
  studentName: string; skillLevel: string; context: string
  weakestTopic: string | null; nextPlanTopic: string | null; lastSessionTopic: string | null
}) {
  const [suggestion, setSuggestion] = useState("")
  const [loading, setLoading] = useState(false)

  function generate() {
    setLoading(true)
    fetch("/api/coach/session-suggestion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentName, skillLevel, context, weakestTopic, nextPlanTopic, lastSessionTopic }),
    }).then(r => r.json()).then(d => { setSuggestion(d.suggestion); setLoading(false) })
      .catch(() => { setSuggestion("Could not load AI suggestion. Check your API key."); setLoading(false) })
  }

  if (loading) return <div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div>

  if (!suggestion) {
    return <button onClick={generate} className="text-sm text-purple-600 border border-purple-200 rounded-lg px-3 py-1.5 hover:bg-purple-50">✦ Generate AI Suggestion</button>
  }

  return <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{suggestion}</p>
}
