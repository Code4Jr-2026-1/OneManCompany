"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

export default function JoinPage() {
  const { token } = useParams<{ token: string }>()
  const [status, setStatus] = useState<"loading" | "ready" | "invalid" | "submitted">("loading")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch(`/api/join/${token}`)
      .then(async r => {
        if (!r.ok) {
          const data = await r.json().catch(() => ({}))
          setError(data.error || "This invite link is invalid.")
          setStatus("invalid")
          return
        }
        setStatus("ready")
      })
      .catch(() => { setError("Something went wrong."); setStatus("invalid") })
  }, [token])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError("")
    const fd = new FormData(e.currentTarget)
    const res = await fetch(`/api/join/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        age: fd.get("age") || null,
        phone: fd.get("phone"),
        email: fd.get("email"),
        skillLevel: fd.get("skillLevel"),
        goals: fd.get("goals"),
        lichessId: fd.get("lichessId"),
        fideId: fd.get("fideId"),
        aicfId: fd.get("aicfId"),
        stateId: fd.get("stateId"),
      }),
    })
    setSubmitting(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error || "Could not submit the form.")
      return
    }
    setStatus("submitted")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4 py-12">
      <div className="absolute inset-0 opacity-5 pointer-events-none"
        style={{ backgroundImage: "repeating-conic-gradient(#fff 0% 25%, transparent 0% 50%)", backgroundSize: "48px 48px" }} />

      <div className="relative w-full max-w-lg">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Chess<span className="text-blue-400">Mate</span>
          </h1>
          <p className="text-slate-400 mt-2 text-sm">Student Onboarding</p>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl">
          {status === "loading" && (
            <p className="text-center text-slate-400 text-sm py-8">Loading…</p>
          )}

          {status === "invalid" && (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">⚠️</div>
              <p className="text-white font-medium mb-1">Unable to load this form</p>
              <p className="text-slate-400 text-sm">{error}</p>
            </div>
          )}

          {status === "submitted" && (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-white font-medium mb-1">Thanks! Your details have been submitted.</p>
              <p className="text-slate-400 text-sm">Your coach will review and approve your profile shortly.</p>
            </div>
          )}

          {status === "ready" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-white font-semibold text-lg mb-2">Tell us about yourself</h2>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name *</label>
                <input name="name" required placeholder="Your name"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Age</label>
                  <input name="age" type="number" placeholder="e.g. 14"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Skill Level</label>
                  <select name="skillLevel" defaultValue="beginner"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option className="bg-slate-800" value="beginner">Beginner</option>
                    <option className="bg-slate-800" value="intermediate">Intermediate</option>
                    <option className="bg-slate-800" value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">WhatsApp Number</label>
                  <input name="phone" type="tel" placeholder="919876543210"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                  <input name="email" type="email" placeholder="you@email.com"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Goals</label>
                <textarea name="goals" rows={2} placeholder="What do you want to achieve?"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" />
              </div>

              <div className="pt-2 border-t border-white/10">
                <p className="text-xs text-slate-500 mb-3 mt-3">Optional — rating IDs (if you have any)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Lichess ID</label>
                    <input name="lichessId" placeholder="username"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">FIDE ID</label>
                    <input name="fideId" placeholder="e.g. 25012345"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">AICF ID</label>
                    <input name="aicfId" placeholder="AICF ID"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">State/MCA ID</label>
                    <input name="stateId" placeholder="State association ID"
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                  </div>
                </div>
              </div>

              {error && (
                <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
                  <span>⚠</span> {error}
                </div>
              )}

              <button type="submit" disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-lg shadow-blue-900/30">
                {submitting ? "Submitting…" : "Submit →"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
