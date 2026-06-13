import Anthropic from "@anthropic-ai/sdk"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  const { studentId, studentName, rating, snapshot } = await req.json()

  const fallback = `Dear Parent,\n\nThis is your monthly progress report for ${studentName}.\n\nThis month, ${studentName} attended ${snapshot?.sessionCount ?? 0} sessions and their current chess rating is ${rating}. Improvement rate: ${Math.round(snapshot?.improvementRate ?? 0)}%.\n\nWe are making steady progress. Please encourage regular practice at home.\n\nBest regards,\nYour Chess Coach`

  let content = fallback
  if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== "sk-ant-...") {
    try {
      const res = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        messages: [{
          role: "user",
          content: `Write a warm, encouraging monthly chess progress report for a parent. Student: ${studentName}. Rating: ${rating}. Sessions this month: ${snapshot?.sessionCount ?? 0}. Improvement rate: ${Math.round(snapshot?.improvementRate ?? 0)}%. Keep it friendly, specific, and end with one tip for parents to support their child's chess journey. 3-4 paragraphs.`
        }],
      })
      if (res.content[0].type === "text") content = res.content[0].text
    } catch { /* fallback */ }
  }

  await prisma.parentReport.create({
    data: {
      studentId,
      month: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      content,
      status: "DRAFT",
    },
  })

  return NextResponse.json({ ok: true })
}
