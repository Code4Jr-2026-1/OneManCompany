import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const coach = await prisma.user.findUnique({ where: { email: session.user!.email! } })
  if (!coach) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const classes = await prisma.groupClass.findMany({
    where: { coachId: coach.id, isActive: true },
    include: {
      enrollments: { where: { status: "ACTIVE" }, include: { student: { select: { id: true, name: true } } } },
      _count: { select: { sessions: true } },
    },
    orderBy: { dayOfWeek: "asc" },
  })

  return NextResponse.json(classes)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const coach = await prisma.user.findUnique({ where: { email: session.user!.email! } })
  if (!coach) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()
  const { name, description, skillLevel, capacity, dayOfWeek, startTime, duration, groupRate } = body

  const groupClass = await prisma.groupClass.create({
    data: {
      coachId: coach.id,
      name,
      description: description || null,
      skillLevel: skillLevel || "all",
      capacity: Number(capacity),
      dayOfWeek: Number(dayOfWeek),
      startTime,
      duration: Number(duration),
      groupRate: Number(groupRate),
    },
  })

  return NextResponse.json(groupClass, { status: 201 })
}
