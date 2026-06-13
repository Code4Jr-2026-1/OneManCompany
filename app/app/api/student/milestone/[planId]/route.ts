import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function PATCH(req: Request, { params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params
  const { milestones } = await req.json()
  const plan = await prisma.improvementPlan.update({
    where: { id: planId },
    data: { milestones: JSON.stringify(milestones) },
  })
  return NextResponse.json(plan)
}
