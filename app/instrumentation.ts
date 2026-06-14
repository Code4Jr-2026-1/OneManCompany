const CHECK_INTERVAL_MS = 5 * 60 * 1000

declare global {
  // eslint-disable-next-line no-var
  var __reminderIntervalStarted: boolean | undefined
}

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return
  if (globalThis.__reminderIntervalStarted) return
  globalThis.__reminderIntervalStarted = true

  const { sendDueReminders } = await import("@/lib/reminders")

  setInterval(() => {
    sendDueReminders()
      .then(({ sent24h, sent1h }) => {
        if (sent24h || sent1h) console.log(`[reminders] sent ${sent24h} 24h + ${sent1h} 1h reminder(s)`)
      })
      .catch(err => console.error("[reminders] check failed:", err))
  }, CHECK_INTERVAL_MS)
}
