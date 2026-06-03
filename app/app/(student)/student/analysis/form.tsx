"use client"
import { useState } from "react"

export function AnalysisForm({ studentId, skillLevel }: { studentId: string | null; skillLevel: string }) {
  const [pgn, setPgn] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ analysis: string; patterns: string[] } | null>(null)

  async function analyse() {
    if (!pgn.trim()) return
    setLoading(true); setResult(null)
    const res = await fetch("/api/student/analysis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pgn, studentId, skillLevel }),
    })
    const data = await res.json()
    setResult(data)
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Paste PGN</label>
        <textarea value={pgn} onChange={e => setPgn(e.target.value)} rows={10}
          placeholder={`1.e4 e5 2.Nf3 Nc6 3.Bb5...`}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm font-mono" />
      </div>
      <button onClick={analyse} disabled={loading || !pgn.trim()}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-3 font-semibold transition-colors disabled:opacity-50">
        {loading ? "Analysing…" : "Analyse Game"}
      </button>
      {result && (
        <div className="bg-purple-900/30 border border-purple-500/20 rounded-xl p-5 space-y-4">
          <div>
            <p className="text-xs text-purple-400 mb-2 font-medium">AI ANALYSIS</p>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{result.analysis}</p>
          </div>
          {result.patterns.length > 0 && (
            <div>
              <p className="text-xs text-purple-400 mb-2 font-medium">PATTERNS DETECTED</p>
              <div className="flex flex-wrap gap-2">
                {result.patterns.map((p, i) => (
                  <span key={i} className="text-xs bg-purple-800/50 text-purple-200 px-2 py-1 rounded-full">{p}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
