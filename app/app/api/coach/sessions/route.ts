import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { studentId, coachNotes, wellness } = await req.json()
  const session = await prisma.coachSession.create({
    data: { studentId, coachNotes, wellness: wellness || null },
  })
  // Update student updatedAt
  await prisma.student.update({ where: { id: studentId }, data: { updatedAt: new Date() } })
  return NextResponse.json(session)
}
