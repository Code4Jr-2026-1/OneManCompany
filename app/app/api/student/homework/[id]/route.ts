import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const hw = await prisma.homework.findUnique({ where: { id } })
  if (!hw) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const updated = await prisma.homework.update({
    where: { id },
    data: { status: hw.status === "DONE" ? "PENDING" : "DONE", completedAt: hw.status === "DONE" ? null : new Date() },
  })
  return NextResponse.json(updated)
}
