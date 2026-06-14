import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const coach = await prisma.user.findUnique({ where: { email: session.user!.email! } })
  if (!coach) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()
  const updated = await prisma.user.update({
    where: { id: coach.id },
    data: {
      upiId: body.upiId ?? null,
      hourlyRate: body.hourlyRate !== undefined ? Number(body.hourlyRate) : undefined,
    },
  })

  return NextResponse.json({ upiId: updated.upiId, hourlyRate: updated.hourlyRate })
}
