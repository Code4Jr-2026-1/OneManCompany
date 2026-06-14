import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const body = await req.json()

  if (body.type === "group") {
    const { groupClassId, date, topicsCovered } = body
    const s = await prisma.groupSession.create({
      data: { groupClassId, date: new Date(date), topicsCovered: topicsCovered || null },
    })
    return NextResponse.json(s)
  }

  const { studentId, scheduledAt, duration, meetingLink } = body
  const s = await prisma.scheduledSession.create({
    data: {
      studentId,
      scheduledAt: new Date(scheduledAt),
      duration: duration || 60,
      status: "CONFIRMED",
      meetingLink: meetingLink || null,
    },
  })
  return NextResponse.json(s)
}
