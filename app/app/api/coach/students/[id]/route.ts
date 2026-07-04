import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const coach = await prisma.user.findUnique({ where: { email: session.user!.email! } })
  if (!coach) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const student = await prisma.student.findFirst({ where: { id, coachId: coach.id } })
  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()
  const data: Record<string, unknown> = {}
  if ("phone" in body) data.phone = body.phone ?? null
  if ("billingType" in body) data.billingType = body.billingType
  if ("monthlyFee" in body) data.monthlyFee = body.monthlyFee != null ? Number(body.monthlyFee) : null
  const updated = await prisma.student.update({ where: { id }, data })

  return NextResponse.json(updated)
}
