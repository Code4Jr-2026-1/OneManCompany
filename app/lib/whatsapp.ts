import twilio from "twilio"

let cachedClient: ReturnType<typeof twilio> | null = null

function getClient() {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) throw new Error("Twilio credentials are not configured")

  if (!cachedClient) cachedClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
  return cachedClient
}

// Normalizes Indian numbers (10-digit local) to E.164. Numbers already starting with "+" are passed through.
function toE164(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "")
  if (digits.startsWith("+")) return digits
  if (digits.length === 10) return `+91${digits}`
  return `+${digits}`
}

export async function sendWhatsApp(opts: { to: string; body: string }): Promise<void> {
  const { TWILIO_WHATSAPP_FROM } = process.env
  if (!TWILIO_WHATSAPP_FROM) throw new Error("Twilio WhatsApp sender is not configured")
  if (!opts.to) throw new Error("No recipient phone number")

  const client = getClient()
  await client.messages.create({
    from: `whatsapp:${TWILIO_WHATSAPP_FROM.replace(/^whatsapp:/, "")}`,
    to: `whatsapp:${toE164(opts.to)}`,
    body: opts.body,
  })
}

export function isWhatsAppConfigured(): boolean {
  return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM)
}
