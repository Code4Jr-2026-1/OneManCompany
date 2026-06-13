"use client"
import { useEffect, useState } from "react"

export function AiSuggestion({ studentName, skillLevel, context, weakestTopic, nextPlanTopic, lastSessionTopic }: {
  studentName: string; skillLevel: string; context: string
  weakestTopic: string | null; nextPlanTopic: string | null; lastSessionTopic: string | null
}) {
  const [suggestion, setSuggestion] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/coach/session-suggestion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentName, skillLevel, context, weakestTopic, nextPlanTopic, lastSessionTopic }),
    }).then(r => r.json()).then(d => { setSuggestion(d.suggestion); setLoading(false) })
      .catch(() => { setSuggestion("Could not load AI suggestion. Check your API key."); setLoading(false) })
  }, [studentName, skillLevel, context, weakestTopic, nextPlanTopic, lastSessionTopic])

  if (loading) return <div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div>

  return <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{suggestion}</p>
}
