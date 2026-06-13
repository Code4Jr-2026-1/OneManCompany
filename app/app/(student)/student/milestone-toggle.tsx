"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function MilestoneToggle({ planId, index, done, milestones }: {
  planId: string; index: number; done: boolean; milestones: { title: string; done: boolean }[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  async function toggle() {
    setLoading(true)
    const updated = milestones.map((m, i) => i === index ? { ...m, done: !m.done } : m)
    await fetch(`/api/student/milestone/${planId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ milestones: updated }),
    })
    setLoading(false)
    router.refresh()
  }
  return (
    <button onClick={toggle} disabled={loading}
      className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-all text-xs disabled:opacity-50 ${done ? "bg-green-500 border-green-500 text-white" : "border-white/30 hover:border-green-400"}`}>
      {done ? "✓" : ""}
    </button>
  )
}
