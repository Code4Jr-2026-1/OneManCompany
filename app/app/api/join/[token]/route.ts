import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const invite = await prisma.studentInvite.findUnique({ where: { token } })
  if (!invite) return NextResponse.json({ error: "Invite not found" }, { status: 404 })
  if (invite.expiresAt < new Date()) return NextResponse.json({ error: "This invite link has expired" }, { status: 410 })
  if (invite.status !== "PENDING") return NextResponse.json({ error: "This invite has already been submitted" }, { status: 409 })
  return NextResponse.json({ status: invite.status, expiresAt: invite.expiresAt })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const invite = await prisma.studentInvite.findUnique({ where: { token } })
  if (!invite) return NextResponse.json({ error: "Invite not found" }, { status: 404 })
  if (invite.expiresAt < new Date()) return NextResponse.json({ error: "This invite link has expired" }, { status: 410 })
  if (invite.status !== "PENDING") return NextResponse.json({ error: "This invite has already been submitted" }, { status: 409 })

  const body = await req.json()
  if (!body.name) return NextResponse.json({ error: "Name is required" }, { status: 400 })

  const updated = await prisma.studentInvite.update({
    where: { token },
    data: {
      status: "SUBMITTED",
      submittedAt: new Date(),
      name: body.name,
      age: body.age ? Number(body.age) : null,
      phone: body.phone || null,
      email: body.email || null,
      skillLevel: body.skillLevel || null,
      goals: body.goals || null,
      lichessId: body.lichessId || null,
      fideId: body.fideId || null,
      aicfId: body.aicfId || null,
      stateId: body.stateId || null,
    },
  })

  return NextResponse.json(updated)
}
