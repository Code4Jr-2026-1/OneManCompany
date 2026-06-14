import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const coach = await prisma.user.findUnique({ where: { email: session.user!.email! } })
  if (!coach) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const invite = await prisma.studentInvite.findFirst({ where: { id, coachId: coach.id } })
  if (!invite) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (invite.status !== "SUBMITTED") return NextResponse.json({ error: "Invite is not awaiting approval" }, { status: 409 })

  const student = await prisma.student.create({
    data: {
      name: invite.name || "New Student",
      age: invite.age,
      skillLevel: invite.skillLevel || "beginner",
      goals: invite.goals,
      phone: invite.phone,
      email: invite.email,
      lichessId: invite.lichessId,
      fideId: invite.fideId,
      aicfId: invite.aicfId,
      stateId: invite.stateId,
      coachId: coach.id,
    },
  })

  await prisma.studentContext.create({
    data: {
      studentId: student.id,
      contextSummary: `${student.name} is a ${student.skillLevel} player. Goals: ${student.goals ?? "Not set"}.`,
    },
  })

  await prisma.studentInvite.update({
    where: { id },
    data: { status: "APPROVED", studentId: student.id },
  })

  return NextResponse.json(student)
}
