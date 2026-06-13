"use client"
import { useRouter } from "next/navigation"

export function HomeworkActions({ hwId }: { hwId: string }) {
  const router = useRouter()
  async function markDone() {
    await fetch(`/api/coach/homework/${hwId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "DONE" }) })
    router.refresh()
  }
  return (
    <button onClick={markDone} className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-lg font-medium">
      Mark Done
    </button>
  )
}
