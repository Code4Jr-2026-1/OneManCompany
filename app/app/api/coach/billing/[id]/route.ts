import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { paid } = await req.json()
  const entry = await prisma.billingEntry.update({
    where: { id },
    data: { paid, paidAt: paid ? new Date() : null },
  })
  return NextResponse.json(entry)
}
