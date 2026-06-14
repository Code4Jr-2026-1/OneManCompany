import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { studentId, title, description, dueDate } = await req.json()

  const hw = await prisma.homework.create({
    data: {
      studentId,
      title,
      description: description || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      status: "PENDING",
    },
  })

  return NextResponse.json(hw, { status: 201 })
}
