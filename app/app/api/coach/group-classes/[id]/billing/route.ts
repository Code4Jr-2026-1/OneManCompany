import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/coach/group-classes/[id]/billing?month=2026-06
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const coach = await prisma.user.findUnique({ where: { email: session.user!.email! } })
  if (!coach) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const groupClass = await prisma.groupClass.findFirst({ where: { id, coachId: coach.id } })
  if (!groupClass) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const monthParam = req.nextUrl.searchParams.get("month")
  const monthDate = monthParam ? new Date(monthParam + "-01") : new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const nextMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1)

  const activeEnrollments = await prisma.groupEnrollment.findMany({
    where: { groupClassId: id, status: "ACTIVE" },
    include: { student: { select: { id: true, name: true } } },
  })

  const sessionsInMonth = await prisma.groupSession.count({
    where: { groupClassId: id, date: { gte: monthDate, lt: nextMonth } },
  })

  const billingRows = await Promise.all(activeEnrollments.map(async (e) => {
    const entry = await prisma.billingEntry.findFirst({
      where: { studentId: e.studentId, groupClassId: id, month: monthDate },
    })
    return {
      studentId: e.student.id,
      studentName: e.student.name,
      sessions: sessionsInMonth,
      rate: groupClass.groupRate,
      amount: sessionsInMonth * groupClass.groupRate,
      paid: entry?.paid ?? false,
      paidAt: entry?.paidAt ?? null,
      billingEntryId: entry?.id ?? null,
    }
  }))

  return NextResponse.json({ month: monthDate, groupRate: groupClass.groupRate, rows: billingRows })
}

// POST /api/coach/group-classes/[id]/billing — mark paid
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const coach = await prisma.user.findUnique({ where: { email: session.user!.email! } })
  if (!coach) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const groupClass = await prisma.groupClass.findFirst({ where: { id, coachId: coach.id } })
  if (!groupClass) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { studentId, month, sessions } = await req.json()
  const monthDate = new Date(month)

  const existing = await prisma.billingEntry.findFirst({
    where: { studentId, groupClassId: id, month: monthDate },
  })

  const entry = existing
    ? await prisma.billingEntry.update({
        where: { id: existing.id },
        data: { paid: true, paidAt: new Date(), amount: sessions * groupClass.groupRate },
      })
    : await prisma.billingEntry.create({
        data: {
          studentId,
          groupClassId: id,
          month: monthDate,
          sessions,
          hours: (sessions * groupClass.duration) / 60,
          rateUsed: groupClass.groupRate,
          amount: sessions * groupClass.groupRate,
          paid: true,
          paidAt: new Date(),
        },
      })

  return NextResponse.json(entry)
}
