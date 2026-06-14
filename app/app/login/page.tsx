"use client"
import { signIn } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChessMateMark } from "@/components/chessmate-logo"

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
    const me = await fetch("/api/me").then(r => r.json())
    if (me.role === "COACH") router.push("/coach")
    else if (me.role === "STUDENT") router.push("/student")
    else if (me.role === "PARENT") router.push("/parent")
    else router.push("/")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">

      {/* Background chess pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none"
        style={{ backgroundImage: "repeating-conic-gradient(#fff 0% 25%, transparent 0% 50%)", backgroundSize: "48px 48px" }} />

      <div className="relative w-full max-w-md px-4">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <ChessMateMark size={64} />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Chess<span className="text-blue-400">Mate</span>
          </h1>
          <p className="text-slate-400 mt-2 text-sm">AI-powered coaching for every chess player</p>
          <div className="flex items-center justify-center gap-4 mt-3">
            {["Session Analysis", "AI Reports", "Smart Homework"].map(f => (
              <span key={f} className="text-xs text-blue-400/70 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-blue-400/50 inline-block" />
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-white font-semibold text-lg mb-6">Sign in to your account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input name="email" type="email" required placeholder="your@email.com"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <input name="password" type="password" required placeholder="••••••••"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
            </div>
            {error && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
                <span>⚠</span> {error}
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-lg shadow-blue-900/30">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : "Sign In →"}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs text-slate-500 text-center mb-3">Quick access — demo accounts</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { role: "Coach", email: "coach@chess.com", pass: "coach123", icon: "🎓" },
                { role: "Student", email: "arjun@chess.com", pass: "student123", icon: "♟" },
                { role: "Parent", email: "parent@chess.com", pass: "parent123", icon: "👨‍👧" },
              ].map(({ role, email, pass, icon }) => (
                <button key={role} onClick={() => {
                  const f = document.querySelector("form")!
                  ;(f.querySelector('[name=email]') as HTMLInputElement).value = email
                  ;(f.querySelector('[name=password]') as HTMLInputElement).value = pass
                }}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/30 rounded-xl p-3 text-slate-400 hover:text-white transition-all cursor-pointer text-center group">
                  <div className="text-lg mb-1">{icon}</div>
                  <div className="text-xs font-medium">{role}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          ChessMate · AI-Powered Chess Coaching Platform
        </p>
      </div>
    </div>
  )
}
