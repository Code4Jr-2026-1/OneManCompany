"use client"
import { useState, useRef, useEffect } from "react"

type Msg = { role: "user" | "assistant"; content: string }

export function MentorChat({ studentId, studentName, context, rating, skillLevel }: {
  studentId: string | null; studentName: string; context: string; rating: number; skillLevel: string
}) {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: `Hi ${studentName}! I'm your personal chess mentor. I know you're a ${skillLevel} player${rating ? ` rated ${rating}` : ""}. What would you like to work on today? I can help with:\n\n• Opening theory and strategy\n• Tactical puzzles and patterns\n• Endgame technique\n• Game analysis\n• Mental tips and focus` }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  async function send() {
    if (!input.trim() || loading) return
    const userMsg: Msg = { role: "user", content: input }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setLoading(true)
    try {
      const res = await fetch("/api/student/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, history: messages, context, rating, skillLevel, studentId }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: "assistant", content: data.reply ?? "Sorry, I couldn't get a response. Please try again." }])
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection error. Please try again." }])
    }
    setLoading(false)
  }

  return (
    <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 py-4">
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm mr-3 mt-1 flex-shrink-0">♟</div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
              m.role === "user" ? "bg-blue-600 text-white" : "bg-card text-foreground border border-border"
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm mr-3 flex-shrink-0">♟</div>
            <div className="bg-card border border-border rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border pt-4">
        <div className="flex gap-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
            placeholder="Ask your chess mentor anything…"
            className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <button onClick={send} disabled={loading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 rounded-xl font-medium transition-colors disabled:opacity-50 text-sm">
            Send
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {studentId ? "Your mentor remembers your history and progress" : "Connect with your coach to unlock personalised mentoring"}
        </p>
      </div>
    </div>
  )
}
