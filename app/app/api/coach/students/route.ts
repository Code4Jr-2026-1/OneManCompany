import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const body = await req.json()
  const student = await prisma.student.create({
    data: {
      name: body.name,
      age: body.age,
      rating: body.rating ?? 0,
      skillLevel: body.skillLevel ?? "beginner",
      goals: body.goals,
      weakness: body.weakness || null,
      notes: body.notes,
      coachId: body.coachId,
    },
  })
  await prisma.studentContext.create({
    data: {
      studentId: student.id,
      contextSummary: `${student.name} is a ${student.skillLevel} player. Goals: ${student.goals ?? "Not set"}. Known weaknesses: ${student.weakness ?? "Not recorded"}.`,
    },
  })
  return NextResponse.json(student)
}
