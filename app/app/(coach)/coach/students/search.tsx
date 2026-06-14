"use client"
import { useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"

export function StudentSearch({ defaultValue }: { defaultValue: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    const params = new URLSearchParams(searchParams.toString())
    if (q) params.set("q", q)
    else params.delete("q")
    startTransition(() => router.replace(`/coach/students?${params.toString()}`))
  }

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">🔍</span>
      <input
        defaultValue={defaultValue}
        onChange={handleChange}
        placeholder="Search students…"
        className="pl-8 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
      />
    </div>
  )
}
