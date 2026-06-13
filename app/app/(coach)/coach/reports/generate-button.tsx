"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

type Snapshot = { rating: number; sessionCount: number; improvementRate: number } | undefined | null

export function SingleReportButton({ studentId, studentName, rating, snapshot }: { studentId: string; studentName: string; rating: number; snapshot: Snapshot }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  async function generate() {
    setLoading(true)
    await fetch("/api/coach/generate-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, studentName, rating, snapshot }),
    })
    setLoading(false)
    router.refresh()
  }
  return (
    <button onClick={generate} disabled={loading} className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded-lg font-medium disabled:opacity-50">
      {loading ? "Generating…" : "Generate Report"}
    </button>
  )
}

export function GenerateAllReportsButton({ students }: { students: { id: string; name: string; rating: number; snapshot: Snapshot }[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  async function generateAll() {
    setLoading(true)
    await Promise.all(students.map(s => fetch("/api/coach/generate-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: s.id, studentName: s.name, rating: s.rating, snapshot: s.snapshot }),
    })))
    setLoading(false)
    router.refresh()
  }
  return (
    <button onClick={generateAll} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
      {loading ? "Generating…" : "✦ Generate All Reports"}
    </button>
  )
}
