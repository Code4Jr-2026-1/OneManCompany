import { NextResponse } from "next/server"
import { openai, MODEL } from "@/lib/openai"

export async function POST(req: Request) {
  const {
    studentName, skillLevel, rating, ratingChange, context,
    topicMastery, planTopics, recentSessions, homeworkDone, homeworkTotal, totalSessions,
  } = await req.json()

  const weakTopics = Object.entries(topicMastery as Record<string, number>)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 2)
    .map(([t, v]) => `${t} (${v}%)`)
    .join(", ")

  const recentSummary = (recentSessions as { date: string; topicsCovered: string | null; aiSummary: string | null }[])
    .map(s => `- ${new Date(s.date).toLocaleDateString("en-IN")}: ${s.topicsCovered || "no topic logged"}${s.aiSummary ? ` — ${s.aiSummary}` : ""}`)
    .join("\n") || "No sessions logged yet."

  const fallback = `Progress overview for ${studentName} (${skillLevel}, rating ${rating}${ratingChange ? `, ${ratingChange >= 0 ? "+" : ""}${ratingChange} recent` : ""}):\n\n` +
    `Total sessions: ${totalSessions}. Homework completed: ${homeworkDone}/${homeworkTotal}.\n` +
    (weakTopics ? `Focus areas: ${weakTopics}.\n` : "") +
    (planTopics?.length ? `Planned topics: ${planTopics.join(", ")}.\n` : "") +
    `\nSuggested next steps: continue reinforcing the weakest areas above with targeted puzzles and review homework completion before each session.`

  try {
    const res = await openai.chat.completions.create({
      model: MODEL,
      max_tokens: 500,
      temperature: 0.5,
      messages: [{
        role: "user",
        content: `You are a ChessMate AI assistant helping a chess coach review a student's overall progress and plan upcoming sessions.

Student: ${studentName}, ${skillLevel} level, rating ${rating}${ratingChange ? ` (${ratingChange >= 0 ? "+" : ""}${ratingChange} recently)` : ""}
Total sessions completed: ${totalSessions}
Homework completion: ${homeworkDone}/${homeworkTotal}
Topic mastery: ${Object.entries(topicMastery as Record<string, number>).map(([t, v]) => `${t}: ${v}%`).join(", ") || "no mastery data"}
Active plan topics: ${planTopics?.length ? planTopics.join(", ") : "none set"}
AI context notes: ${context || "none"}

Recent session history:
${recentSummary}

Write a concise progress summary (2-3 sentences) covering how the student is trending, then a short "Suggested plan" with 2-3 bullet points for upcoming sessions/classes (specific topics, drills, or homework). Be specific and practical. No fluff.`
      }],
    })
    return NextResponse.json({ summary: res.choices[0].message.content ?? fallback })
  } catch {
    return NextResponse.json({ summary: fallback })
  }
}
