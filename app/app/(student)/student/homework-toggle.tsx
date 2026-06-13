"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function HomeworkToggle({ hwId }: { hwId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  async function toggle() {
    setLoading(true)
    await fetch(`/api/student/homework/${hwId}`, { method: "PATCH" })
    setLoading(false)
    router.refresh()
  }
  return (
    <button onClick={toggle} disabled={loading}
      className="w-5 h-5 rounded border border-white/30 flex items-center justify-center flex-shrink-0 hover:border-green-400 hover:bg-green-400/20 transition-colors disabled:opacity-50 mt-0.5">
      {loading ? <span className="text-xs">…</span> : null}
    </button>
  )
}
