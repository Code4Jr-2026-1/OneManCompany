import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

// POST /api/coach/billing/private — mark current month's private billing as paid
export async function POST(req: Request) {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const coach = await prisma.user.findUnique({ where: { email: session.user!.email! } })
  if (!coach) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { studentId, month, sessions, hours, amount } = await req.json()

  const student = await prisma.student.findFirst({ where: { id: studentId, coachId: coach.id } })
  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const monthDate = new Date(month)

  const existing = await prisma.billingEntry.findFirst({
    where: { studentId, groupClassId: null, month: monthDate },
  })

  const entry = existing
    ? await prisma.billingEntry.update({
        where: { id: existing.id },
        data: { paid: true, paidAt: new Date(), sessions, hours, amount },
      })
    : await prisma.billingEntry.create({
        data: {
          studentId,
          month: monthDate,
          sessions,
          hours,
          rateUsed: hours > 0 ? amount / hours : 0,
          amount,
          paid: true,
          paidAt: new Date(),
        },
      })

  return NextResponse.json(entry)
}
