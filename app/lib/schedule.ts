export type UpcomingItem =
  | { kind: "private"; date: Date; duration: number; meetingLink: string | null; notes: string | null }
  | { kind: "group"; date: Date; name: string; duration: number; meetingLink: string | null }

/** Merges upcoming private sessions with recurring group classes into a sorted timeline. */
export function buildUpcomingItems(opts: {
  scheduledSessions: { scheduledAt: Date; duration: number; meetingLink: string | null; notes: string | null }[]
  groupClasses: { name: string; dayOfWeek: number; startTime: string; duration: number; meetingLink: string | null }[]
  now?: Date
  days?: number
}): UpcomingItem[] {
  const now = opts.now ?? new Date()
  const days = opts.days ?? 7
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)

  const items: UpcomingItem[] = []

  for (const ss of opts.scheduledSessions) {
    if (new Date(ss.scheduledAt) >= now) {
      items.push({ kind: "private", date: new Date(ss.scheduledAt), duration: ss.duration, meetingLink: ss.meetingLink, notes: ss.notes })
    }
  }

  for (let offset = 0; offset <= days; offset++) {
    const day = new Date(todayStart.getTime() + offset * 86400000)
    const dow = day.getDay()
    for (const gc of opts.groupClasses) {
      if (gc.dayOfWeek === dow) {
        const [h, m] = gc.startTime.split(":").map(Number)
        const date = new Date(day)
        date.setHours(h, m, 0, 0)
        if (date >= now) items.push({ kind: "group", date, name: gc.name, duration: gc.duration, meetingLink: gc.meetingLink })
      }
    }
  }

  items.sort((a, b) => a.date.getTime() - b.date.getTime())
  return items
}
