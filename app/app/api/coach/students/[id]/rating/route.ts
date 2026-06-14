import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { monthBounds } from "@/lib/billing"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const coach = await prisma.user.findUnique({ where: { email: session.user!.email! } })
  if (!coach) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const student = await prisma.student.findFirst({ where: { id, coachId: coach.id } })
  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()
  const rating = Number(body.rating)
  if (!Number.isFinite(rating)) return NextResponse.json({ error: "Invalid rating" }, { status: 400 })

  const { monthStart, nextMonth } = monthBounds(new Date())

  const previous = await prisma.progressSnapshot.findFirst({
    where: { studentId: id, month: { lt: monthStart } },
    orderBy: { month: "desc" },
  })
  const improvementRate = previous && previous.rating !== 0
    ? ((rating - previous.rating) / previous.rating) * 100
    : 0

  const sessionCount = await prisma.coachSession.count({
    where: { studentId: id, date: { gte: monthStart, lt: nextMonth } },
  })

  await prisma.$transaction([
    prisma.student.update({ where: { id }, data: { rating } }),
    prisma.progressSnapshot.upsert({
      where: { studentId_month: { studentId: id, month: monthStart } },
      update: { rating, improvementRate, sessionCount },
      create: { studentId: id, month: monthStart, rating, improvementRate, sessionCount },
    }),
  ])

  return NextResponse.json({ rating })
}
