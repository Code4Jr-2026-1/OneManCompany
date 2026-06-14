let cachedToken: { token: string; expiresAt: number } | null = null

async function getZoomAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.token

  const { ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET } = process.env
  if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
    throw new Error("Zoom credentials are not configured")
  }

  const basicAuth = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString("base64")
  const res = await fetch(`https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`, {
    method: "POST",
    headers: { Authorization: `Basic ${basicAuth}` },
  })
  if (!res.ok) throw new Error(`Zoom auth failed: ${res.status} ${await res.text()}`)

  const data = await res.json()
  cachedToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 }
  return cachedToken.token
}

export async function createZoomMeeting(opts: { topic: string; startTime: Date; duration: number }): Promise<string> {
  const token = await getZoomAccessToken()

  const res = await fetch("https://api.zoom.us/v2/users/me/meetings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic: opts.topic,
      type: 2, // scheduled meeting
      start_time: opts.startTime.toISOString(),
      duration: opts.duration,
      timezone: "Asia/Kolkata",
      settings: { join_before_host: true, waiting_room: false },
    }),
  })
  if (!res.ok) throw new Error(`Zoom meeting creation failed: ${res.status} ${await res.text()}`)

  const data = await res.json()
  return data.join_url as string
}

export function isZoomConfigured(): boolean {
  return !!(process.env.ZOOM_ACCOUNT_ID && process.env.ZOOM_CLIENT_ID && process.env.ZOOM_CLIENT_SECRET)
}
