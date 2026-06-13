import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function getCoachAndClass(id: string) {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH") return null

  const coach = await prisma.user.findUnique({ where: { email: session.user!.email! } })
  if (!coach) return null

  const groupClass = await prisma.groupClass.findFirst({ where: { id, coachId: coach.id } })
  if (!groupClass) return null

  return { coach, groupClass }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getCoachAndClass(id)
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const groupClass = await prisma.groupClass.findUnique({
    where: { id },
    include: {
      enrollments: {
        include: { student: { select: { id: true, name: true, skillLevel: true } } },
        orderBy: { enrolledAt: "asc" },
      },
      sessions: { orderBy: { date: "desc" }, take: 20 },
    },
  })

  return NextResponse.json(groupClass)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getCoachAndClass(id)
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()

  if (body.capacity !== undefined) {
    const activeCount = await prisma.groupEnrollment.count({
      where: { groupClassId: id, status: "ACTIVE" },
    })
    if (Number(body.capacity) < activeCount) {
      return NextResponse.json(
        { error: `Cannot reduce capacity below current enrollment (${activeCount} active students)` },
        { status: 422 }
      )
    }
  }

  const updated = await prisma.groupClass.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description,
      skillLevel: body.skillLevel,
      capacity: body.capacity !== undefined ? Number(body.capacity) : undefined,
      dayOfWeek: body.dayOfWeek !== undefined ? Number(body.dayOfWeek) : undefined,
      startTime: body.startTime,
      duration: body.duration !== undefined ? Number(body.duration) : undefined,
      groupRate: body.groupRate !== undefined ? Number(body.groupRate) : undefined,
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ctx = await getCoachAndClass(id)
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await prisma.groupClass.update({ where: { id }, data: { isActive: false } })
  return NextResponse.json({ ok: true })
}
