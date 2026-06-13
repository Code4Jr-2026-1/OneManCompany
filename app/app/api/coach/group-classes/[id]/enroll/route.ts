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

  const groupClass = await prisma.groupClass.findFirst({ where: { id, coachId: coach.id } })
  if (!groupClass) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { studentId } = await req.json()

  const existing = await prisma.groupEnrollment.findUnique({
    where: { groupClassId_studentId: { groupClassId: id, studentId } },
  })
  if (existing) {
    if (existing.status === "DROPPED") {
      // Re-enroll
    } else {
      return NextResponse.json({ error: "Student already enrolled" }, { status: 409 })
    }
  }

  const activeCount = await prisma.groupEnrollment.count({
    where: { groupClassId: id, status: "ACTIVE" },
  })
  const status = activeCount < groupClass.capacity ? "ACTIVE" : "WAITLISTED"

  const enrollment = existing
    ? await prisma.groupEnrollment.update({
        where: { groupClassId_studentId: { groupClassId: id, studentId } },
        data: { status, updatedAt: new Date() },
      })
    : await prisma.groupEnrollment.create({
        data: { groupClassId: id, studentId, status },
      })

  return NextResponse.json(enrollment, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const coach = await prisma.user.findUnique({ where: { email: session.user!.email! } })
  if (!coach) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { studentId } = await req.json()

  await prisma.groupEnrollment.update({
    where: { groupClassId_studentId: { groupClassId: id, studentId } },
    data: { status: "DROPPED" },
  })

  // Promote next waitlisted student
  const next = await prisma.groupEnrollment.findFirst({
    where: { groupClassId: id, status: "WAITLISTED" },
    orderBy: { enrolledAt: "asc" },
  })
  if (next) {
    await prisma.groupEnrollment.update({
      where: { id: next.id },
      data: { status: "ACTIVE" },
    })
  }

  return NextResponse.json({ ok: true })
}
