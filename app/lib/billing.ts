export function monthBounds(date: Date) {
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
  const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1)
  return { monthStart, nextMonth }
}

/** Live amount due for a private student in a given month, based on actual session hours. */
export function privateAmount(hours: number, hourlyRate: number) {
  return Math.round(hours * hourlyRate)
}

/** Live amount due for a group enrollment in a given month. */
export function groupAmount(sessions: number, groupRate: number) {
  return sessions * groupRate
}
