"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function AddStudentForm({ coachId }: { coachId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    await fetch("/api/coach/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        coachId,
        name: fd.get("name"),
        age: fd.get("age") ? Number(fd.get("age")) : null,
        rating: Number(fd.get("rating") || 0),
        skillLevel: fd.get("skillLevel"),
        goals: fd.get("goals"),
        notes: fd.get("notes"),
      }),
    })
    router.push("/coach")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-5">
      {[
        { label: "Full Name", name: "name", type: "text", required: true, placeholder: "Student name" },
        { label: "Age", name: "age", type: "number", required: false, placeholder: "e.g. 14" },
        { label: "Current Rating", name: "rating", type: "number", required: false, placeholder: "0 if unrated" },
      ].map(f => (
        <div key={f.name}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
          <input name={f.name} type={f.type} required={f.required} placeholder={f.placeholder}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      ))}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Skill Level</label>
        <select name="skillLevel" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Goals</label>
        <textarea name="goals" rows={3} placeholder="What does this student want to achieve?" className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Coach Notes</label>
        <textarea name="notes" rows={2} placeholder="Initial observations..." className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {loading ? "Saving…" : "Add Student"}
        </button>
        <button type="button" onClick={() => router.back()} className="border px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
      </div>
    </form>
  )
}
