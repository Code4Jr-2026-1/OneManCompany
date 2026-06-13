import Anthropic from "@anthropic-ai/sdk"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: Request) {
  const { studentId, studentName, topicsCovered, wellness, homeworkTasks, nextSessionDate, duration } = await req.json()

  // Generate AI summary
  let aiSummary = `Session covered: ${topicsCovered}. Student energy: ${wellness}.`
  if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== "sk-ant-...") {
    try {
      const res = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        messages: [{
          role: "user",
          content: `Write a brief (3-4 sentence) coaching session summary for ${studentName}:
Topics covered: ${topicsCovered}
Student energy/wellness: ${wellness}
Homework assigned: ${homeworkTasks.join(", ") || "None"}
Next session: ${nextSessionDate}

Keep it professional, note any observations or suggestions for next session.`
        }],
      })
      if (res.content[0].type === "text") aiSummary = res.content[0].text
    } catch { /* use fallback */ }
  }

  // Save session
  await prisma.coachSession.create({
    data: {
      studentId,
      duration: duration || 60,
      topicsCovered,
      wellness,
      coachNotes: topicsCovered,
      aiSummary,
      homeworkSet: homeworkTasks.length ? homeworkTasks.join("; ") : null,
      nextSessionDate: nextSessionDate ? new Date(nextSessionDate) : null,
    },
  })

  // Save homework entries
  for (const task of homeworkTasks) {
    if (!task) continue
    await prisma.homework.create({
      data: {
        studentId,
        title: task,
        dueDate: nextSessionDate ? new Date(nextSessionDate) : null,
        status: "PENDING",
      },
    })
  }

  // Schedule next session
  if (nextSessionDate) {
    await prisma.scheduledSession.create({
      data: {
        studentId,
        scheduledAt: new Date(nextSessionDate),
        duration: duration || 60,
        status: "CONFIRMED",
      },
    })
  }

  // Update student updatedAt
  await prisma.student.update({ where: { id: studentId }, data: { updatedAt: new Date() } })

  return NextResponse.json({ ok: true, aiSummary })
}
