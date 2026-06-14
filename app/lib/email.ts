import nodemailer from "nodemailer"

let cachedTransport: ReturnType<typeof nodemailer.createTransport> | null = null

function getTransport() {
  const { GMAIL_USER, GMAIL_APP_PASSWORD } = process.env
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) throw new Error("Gmail credentials are not configured")

  if (!cachedTransport) {
    cachedTransport = nodemailer.createTransport({
      service: "gmail",
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    })
  }
  return cachedTransport
}

export async function sendEmail(opts: { to: string[]; subject: string; text: string }): Promise<void> {
  const to = opts.to.filter(Boolean)
  if (to.length === 0) throw new Error("No recipient email address")

  const transport = getTransport()
  await transport.sendMail({
    from: process.env.GMAIL_USER,
    to: to.join(","),
    subject: opts.subject,
    text: opts.text,
  })
}

export function isEmailConfigured(): boolean {
  return !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)
}
