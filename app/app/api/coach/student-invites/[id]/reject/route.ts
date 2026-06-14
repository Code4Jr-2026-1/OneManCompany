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

  const updated = await prisma.studentInvite.update({
    where: { id },
    data: { status: "REJECTED" },
  })

  return NextResponse.json(updated)
}
