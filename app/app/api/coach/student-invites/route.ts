import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { randomBytes } from "crypto"

const EXPIRY_DAYS = 7

export async function GET() {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const coach = await prisma.user.findUnique({ where: { email: session.user!.email! } })
  if (!coach) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const invites = await prisma.studentInvite.findMany({
    where: { coachId: coach.id },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(invites)
}

export async function POST() {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const coach = await prisma.user.findUnique({ where: { email: session.user!.email! } })
  if (!coach) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const token = randomBytes(12).toString("hex")
  const expiresAt = new Date(Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000)

  const invite = await prisma.studentInvite.create({
    data: { token, coachId: coach.id, expiresAt },
  })

  return NextResponse.json(invite)
}
