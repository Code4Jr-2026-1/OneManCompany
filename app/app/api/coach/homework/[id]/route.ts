import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { status } = await req.json()
  const hw = await prisma.homework.update({
    where: { id },
    data: { status, completedAt: status === "DONE" ? new Date() : null },
  })
  return NextResponse.json(hw)
}
