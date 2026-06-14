import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { content, status } = body

  const report = await prisma.parentReport.update({
    where: { id },
    data: {
      ...(content !== undefined ? { content } : {}),
      ...(status === "APPROVED" ? { status: "DRAFT" } : {}),
      ...(status === "SENT" ? { status: "SENT", sentAt: new Date() } : {}),
    },
  })

  return NextResponse.json(report)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await prisma.parentReport.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
