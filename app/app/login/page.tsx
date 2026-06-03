"use client"
import { signIn } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true); setError("")
    const form = new FormData(e.currentTarget)
    const res = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    })
    setLoading(false)
    if (res?.error) { setError("Invalid email or password"); return }
    // Role-based redirect via server
    const me = await fetch("/api/me").then(r => r.json())
    if (me.role === "COACH") router.push("/coach")
    else if (me.role === "STUDENT") router.push("/student")
    else if (me.role === "PARENT") router.push("/parent")
    else router.push("/")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-blue-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">♟</div>
          <h1 className="text-3xl font-bold text-white">Chess Coach Portal</h1>
          <p className="text-slate-400 mt-2">AI-powered coaching for every student</p>
        </div>
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <input name="email" type="email" required placeholder="your@email.com"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <input name="password" type="password" required placeholder="••••••••"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {error && <p className="text-red-400 text-sm bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-semibold transition-colors disabled:opacity-50">
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs text-slate-500 text-center mb-3">Demo accounts:</p>
            <div className="grid grid-cols-3 gap-2 text-xs text-center">
              {[["Coach","coach@chess.com","coach123"],["Student","arjun@chess.com","student123"],["Parent","parent@chess.com","parent123"]].map(([role,email,pass]) => (
                <button key={role} onClick={() => {
                  const f = document.querySelector("form")!
                  ;(f.querySelector('[name=email]') as HTMLInputElement).value = email
                  ;(f.querySelector('[name=password]') as HTMLInputElement).value = pass
                }}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg p-2 text-slate-400 hover:text-white transition-colors cursor-pointer">
                  <div className="font-medium">{role}</div>
                  <div className="opacity-60 truncate">{email}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
