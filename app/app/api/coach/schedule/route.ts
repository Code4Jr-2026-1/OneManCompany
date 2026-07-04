import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { createZoomMeeting, isZoomConfigured } from "@/lib/zoom"
import { sendEmail, isEmailConfigured } from "@/lib/email"
import { sendWhatsApp, isWhatsAppConfigured } from "@/lib/whatsapp"

export async function POST(req: Request) {
  const body = await req.json()

  if (body.type === "group") {
    const { groupClassId, date, topicsCovered } = body
    const s = await prisma.groupSession.create({
      data: { groupClassId, date: new Date(date), topicsCovered: topicsCovered || null },
    })
    return NextResponse.json(s)
  }

  const session = await auth()
  const coach = session ? await prisma.user.findUnique({ where: { email: session.user!.email! } }) : null

  const { studentId, scheduledAt, duration, meetingLink: meetingLinkInput } = body
  const startTime = new Date(scheduledAt)
  const sessionDuration = duration || 60

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { user: { select: { email: true } }, parent: { select: { email: true } } },
  })

  let meetingLink: string | null = meetingLinkInput || null
  if (!meetingLink && isZoomConfigured() && student) {
    try {
      meetingLink = await createZoomMeeting({
        topic: `Chess Session: ${coach?.name ?? "Coach"} & ${student.name}`,
        startTime,
        duration: sessionDuration,
      })
    } catch (err) {
      console.error("[schedule] Zoom meeting creation failed:", err)
    }
  }
  // Fall back to coach's default meeting room if still no link
  if (!meetingLink && coach) {
    meetingLink = (coach as { defaultMeetingLink?: string | null }).defaultMeetingLink ?? null
  }

  const s = await prisma.scheduledSession.create({
    data: {
      studentId,
      scheduledAt: startTime,
      duration: sessionDuration,
      status: "CONFIRMED",
      meetingLink,
    },
  })

  const invite = { emailSent: false, whatsappSent: false, emailError: null as string | null, whatsappError: null as string | null }

  if (student) {
    const when = startTime.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
    const message = `Hi ${student.name}, your chess session with ${coach?.name ?? "your coach"} is scheduled for ${when} (${sessionDuration} min).` +
      (meetingLink ? `\nJoin here: ${meetingLink}` : "")

    const emails = [student.user?.email, student.parent?.email].filter((e): e is string => !!e)
    if (isEmailConfigured() && emails.length > 0) {
      try {
        await sendEmail({ to: emails, subject: "Chess Session Scheduled", text: message })
        invite.emailSent = true
      } catch (err) {
        invite.emailError = err instanceof Error ? err.message : String(err)
        console.error("[schedule] Email invite failed:", err)
      }
    }

    if (isWhatsAppConfigured() && student.phone) {
      try {
        await sendWhatsApp({ to: student.phone, body: message })
        invite.whatsappSent = true
      } catch (err) {
        invite.whatsappError = err instanceof Error ? err.message : String(err)
        console.error("[schedule] WhatsApp invite failed:", err)
      }
    }
  }

  return NextResponse.json({ ...s, invite })
}
