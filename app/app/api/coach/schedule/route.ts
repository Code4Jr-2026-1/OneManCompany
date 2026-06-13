import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { studentId, scheduledAt, duration } = await req.json()
  const s = await prisma.scheduledSession.create({
    data: { studentId, scheduledAt: new Date(scheduledAt), duration: duration || 60, status: "CONFIRMED" },
  })
  return NextResponse.json(s)
}
