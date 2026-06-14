import { prisma } from "@/lib/prisma"
import { sendEmail, isEmailConfigured } from "@/lib/email"
import { sendWhatsApp, isWhatsAppConfigured } from "@/lib/whatsapp"

const HOUR = 60 * 60 * 1000

function buildMessage(opts: { studentName: string; coachName: string; scheduledAt: Date; duration: number; meetingLink: string | null; label: string }) {
  const when = opts.scheduledAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
  return `Hi ${opts.studentName}, reminder: your chess session with ${opts.coachName} is ${opts.label} (${when}, ${opts.duration} min).` +
    (opts.meetingLink ? `\nJoin here: ${opts.meetingLink}` : "")
}

async function sendReminder(session: {
  id: string; scheduledAt: Date; duration: number; meetingLink: string | null
  student: { name: string; phone: string | null; user: { email: string | null } | null; parent: { email: string | null } | null; coach: { name: string | null } }
}, label: string) {
  const message = buildMessage({
    studentName: session.student.name,
    coachName: session.student.coach.name ?? "your coach",
    scheduledAt: session.scheduledAt,
    duration: session.duration,
    meetingLink: session.meetingLink,
    label,
  })

  const emails = [session.student.user?.email, session.student.parent?.email].filter((e): e is string => !!e)
  if (isEmailConfigured() && emails.length > 0) {
    try {
      await sendEmail({ to: emails, subject: "Chess Session Reminder", text: message })
    } catch (err) {
      console.error(`[reminders] Email reminder failed for session ${session.id}:`, err)
    }
  }

  if (isWhatsAppConfigured() && session.student.phone) {
    try {
      await sendWhatsApp({ to: session.student.phone, body: message })
    } catch (err) {
      console.error(`[reminders] WhatsApp reminder failed for session ${session.id}:`, err)
    }
  }
}

// Finds upcoming confirmed sessions due for a 24h or 1h reminder and sends them via email/WhatsApp.
export async function sendDueReminders(): Promise<{ sent24h: number; sent1h: number }> {
  if (!isEmailConfigured() && !isWhatsAppConfigured()) return { sent24h: 0, sent1h: 0 }

  const now = new Date()
  const include = { student: { include: { user: { select: { email: true } }, parent: { select: { email: true } }, coach: { select: { name: true } } } } }

  const due24h = await prisma.scheduledSession.findMany({
    where: { status: "CONFIRMED", reminder24hSent: false, scheduledAt: { gt: now, lte: new Date(now.getTime() + 24 * HOUR) } },
    include,
  })
  for (const session of due24h) {
    await sendReminder(session, "in about 24 hours")
    await prisma.scheduledSession.update({ where: { id: session.id }, data: { reminder24hSent: true } })
  }

  const due1h = await prisma.scheduledSession.findMany({
    where: { status: "CONFIRMED", reminder1hSent: false, scheduledAt: { gt: now, lte: new Date(now.getTime() + 1 * HOUR) } },
    include,
  })
  for (const session of due1h) {
    await sendReminder(session, "in about 1 hour")
    await prisma.scheduledSession.update({ where: { id: session.id }, data: { reminder1hSent: true } })
  }

  return { sent24h: due24h.length, sent1h: due1h.length }
}
