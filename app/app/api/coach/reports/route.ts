import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { studentId, content } = await req.json()
  const currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

  const existing = await prisma.parentReport.findFirst({
    where: { studentId, month: currentMonth, status: "DRAFT" },
  })

  const report = existing
    ? await prisma.parentReport.update({ where: { id: existing.id }, data: { content } })
    : await prisma.parentReport.create({ data: { studentId, month: currentMonth, content, status: "DRAFT" } })

  return NextResponse.json(report)
}
