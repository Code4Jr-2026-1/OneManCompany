"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { waLink } from "@/lib/invite"
import { EmailInviteButton } from "@/components/email-invite-button"
import { DurationField } from "@/components/duration-field"

type PrivateEvent = { id: string; studentId: string; studentName: string; studentPhone: string | null; studentEmails: string[]; scheduledAt: string; duration: number; status: string; meetingLink: string | null; type: "private" }
type GroupEvent   = { id: string; name: string; dayOfWeek: number; startTime: string; duration: number; enrolledCount: number; capacity: number; meetingLink: string | null; whatsappGroupLink: string | null; enrolledEmails: string[]; type: "group" }

type StudentContact = { id: string; name: string; phone: string | null; emails: string[] }
type GroupContact = { id: string; name: string; startTime: string; duration: number; meetingLink: string | null; whatsappGroupLink: string | null; enrolledEmails: string[] }

const STUDENT_COLORS = ["bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500", "bg-pink-500", "bg-indigo-500"]

function getWeekDays(base: Date) {
  const start = new Date(base)
  start.setDate(start.getDate() - start.getDay() + 1)
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d })
}

type BookedInvite =
  | { kind: "private"; studentName: string; phone: string | null; emails: string[]; message: string; subject: string; meetingLink: string | null; autoEmailSent: boolean; autoWhatsappSent: boolean }
  | { kind: "group"; className: string; emails: string[]; message: string; subject: string; meetingLink: string | null; whatsappGroupLink: string | null }

export function AddSessionButton({ students, groupClasses }: { students: StudentContact[]; groupClasses: GroupContact[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState<"private" | "group">("private")
  const [invite, setInvite] = useState<BookedInvite | null>(null)

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)

    if (type === "group") {
      const groupClassId = fd.get("groupClassId") as string
      const date = fd.get("date") as string
      const gc = groupClasses.find(g => g.id === groupClassId)!
      await fetch("/api/coach/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "group", groupClassId, date }),
      })
      const dateStr = new Date(date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })
      const message = `Hi! Reminder for our group class "${gc.name}" on ${dateStr} at ${gc.startTime} (${gc.duration} min).` +
        (gc.meetingLink ? `\nJoin here: ${gc.meetingLink}` : "")
      setInvite({ kind: "group", className: gc.name, emails: gc.enrolledEmails, message, subject: `Group Class Reminder: ${gc.name}`, meetingLink: gc.meetingLink, whatsappGroupLink: gc.whatsappGroupLink })
    } else {
      const studentId = fd.get("studentId") as string
      const datetime = fd.get("datetime") as string
      const duration = Number(fd.get("duration"))
      const meetingLink = (fd.get("meetingLink") as string) || null
      const student = students.find(s => s.id === studentId)!
      const res = await fetch("/api/coach/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, scheduledAt: datetime, duration, meetingLink }),
      })
      const created = await res.json()
      const resolvedMeetingLink = created.meetingLink ?? meetingLink
      const dt = new Date(datetime)
      const dateStr = dt.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })
      const timeStr = dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
      const message = `Hi ${student.name}! Your chess session is scheduled for ${dateStr} at ${timeStr} (${duration} min).` +
        (resolvedMeetingLink ? `\nJoin here: ${resolvedMeetingLink}` : "")
      setInvite({
        kind: "private", studentName: student.name, phone: student.phone, emails: student.emails, message, subject: "Chess Session Scheduled",
        meetingLink: resolvedMeetingLink,
        autoEmailSent: !!created.invite?.emailSent,
        autoWhatsappSent: !!created.invite?.whatsappSent,
      })
    }

    setLoading(false)
    router.refresh()
  }

  function close() {
    setOpen(false)
    setInvite(null)
    setType("private")
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
        + Schedule Session
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={close}>
          <div className="bg-card rounded-xl p-6 w-96 shadow-xl" onClick={e => e.stopPropagation()}>
            {invite ? (
              <>
                <h2 className="font-bold text-foreground mb-1">Session Scheduled ✓</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  {invite.kind === "private" ? `Private session with ${invite.studentName}` : `Group class "${invite.className}"`}
                </p>
                {invite.kind === "private" && (invite.autoEmailSent || invite.autoWhatsappSent) && (
                  <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-3 text-xs text-green-700 space-y-0.5">
                    {invite.autoWhatsappSent && <p>✓ WhatsApp invite sent automatically</p>}
                    {invite.autoEmailSent && <p>✓ Email invite sent automatically</p>}
                  </div>
                )}
                <div className="space-y-2">
                  {!(invite.kind === "private" && invite.autoWhatsappSent) && (
                    <a href={waLink(invite.kind === "private" ? invite.phone : null, invite.message)} target="_blank" rel="noopener noreferrer"
                      className="block text-center bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700">
                      Send WhatsApp Invite
                    </a>
                  )}
                  {invite.kind === "group" && invite.whatsappGroupLink && (
                    <a href={invite.whatsappGroupLink} target="_blank" rel="noopener noreferrer"
                      className="block text-center border border-green-600 text-green-700 py-2 rounded-lg text-sm font-medium hover:bg-green-50">
                      Open WhatsApp Group
                    </a>
                  )}
                  {!(invite.kind === "private" && invite.autoEmailSent) && (
                    <EmailInviteButton emails={invite.emails} subject={invite.subject} body={invite.message}
                      linkClassName="block text-center border py-2 rounded-lg text-sm font-medium hover:bg-accent" />
                  )}
                </div>
                <button type="button" onClick={close} className="w-full mt-4 border px-4 py-2 rounded-lg text-sm hover:bg-accent">Done</button>
              </>
            ) : (
              <>
                <h2 className="font-bold text-foreground mb-4">Schedule Session</h2>

                <div className="flex gap-2 mb-4">
                  <button type="button" onClick={() => setType("private")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border ${type === "private" ? "bg-blue-600 text-white border-blue-600" : "text-muted-foreground hover:bg-accent"}`}>
                    Private
                  </button>
                  <button type="button" onClick={() => setType("group")}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border ${type === "group" ? "bg-teal-600 text-white border-teal-600" : "text-muted-foreground hover:bg-accent"}`}>
                    Group
                  </button>
                </div>

                <form onSubmit={save} className="space-y-4">
                  {type === "private" ? (
                    <>
                      <div>
                        <label className="text-sm font-medium text-foreground block mb-1">Student</label>
                        <select name="studentId" required className="w-full border rounded-lg px-3 py-2 text-sm">
                          {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground block mb-1">Date & Time</label>
                        <input name="datetime" type="datetime-local" required className="w-full border rounded-lg px-3 py-2 text-sm" />
                      </div>
                      <DurationField defaultValue={60} />
                      <div>
                        <label className="text-sm font-medium text-foreground block mb-1">Meeting Link <span className="text-muted-foreground font-normal">(optional — a Zoom link is created automatically if left blank)</span></label>
                        <input name="meetingLink" type="url" placeholder="https://meet.google.com/..." className="w-full border rounded-lg px-3 py-2 text-sm" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="text-sm font-medium text-foreground block mb-1">Group Class</label>
                        <select name="groupClassId" required className="w-full border rounded-lg px-3 py-2 text-sm">
                          {groupClasses.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground block mb-1">Date</label>
                        <input name="date" type="date" required className="w-full border rounded-lg px-3 py-2 text-sm" />
                      </div>
                    </>
                  )}
                  <div className="flex gap-3">
                    <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                      {loading ? "Saving…" : "Schedule"}
                    </button>
                    <button type="button" onClick={close} className="border px-4 py-2 rounded-lg text-sm hover:bg-accent">Cancel</button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

function GroupPopover({ event, day, onClose }: { event: GroupEvent; day: Date; onClose: () => void }) {
  const dateStr = day.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })
  const message = `Hi! Reminder for our group class "${event.name}" on ${dateStr} at ${event.startTime} (${event.duration} min).` +
    (event.meetingLink ? `\nJoin here: ${event.meetingLink}` : "")

  return (
    <div className="absolute top-full left-0 mt-1 z-30 bg-card border rounded-xl shadow-lg p-3 w-56 text-xs" onClick={e => e.stopPropagation()}>
      <p className="font-semibold text-foreground mb-1">{event.name}</p>
      <p className="text-muted-foreground mb-2">{event.enrolledCount}/{event.capacity} students · {event.duration} min</p>
      <div className="flex flex-col gap-2">
        {event.meetingLink && (
          <a href={event.meetingLink} target="_blank" rel="noopener noreferrer" onClick={onClose}
            className="text-center bg-blue-600 text-white py-1 rounded-lg hover:bg-blue-700">Join Meeting ↗</a>
        )}
        <Link href={`/coach/group-classes/${event.id}`} onClick={onClose}
          className="text-center bg-teal-600 text-white py-1 rounded-lg hover:bg-teal-700">View Roster</Link>
        <a href={waLink(null, message)} target="_blank" rel="noopener noreferrer" onClick={onClose}
          className="text-center bg-green-600 text-white py-1 rounded-lg hover:bg-green-700">Send WhatsApp Invite</a>
        {event.whatsappGroupLink && (
          <a href={event.whatsappGroupLink} target="_blank" rel="noopener noreferrer" onClick={onClose}
            className="text-center border border-green-600 text-green-700 py-1 rounded-lg hover:bg-green-50">Open WhatsApp Group</a>
        )}
        <EmailInviteButton emails={event.enrolledEmails} subject={`Group Class Reminder: ${event.name}`} body={message}
          linkClassName="text-center border py-1 rounded-lg hover:bg-accent" />
      </div>
    </div>
  )
}

function PrivatePopover({ event, onClose }: { event: PrivateEvent; onClose: () => void }) {
  const dt = new Date(event.scheduledAt)
  const dateStr = dt.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })
  const timeStr = dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
  const message = `Hi ${event.studentName}! Reminder for your chess session on ${dateStr} at ${timeStr} (${event.duration} min).` +
    (event.meetingLink ? `\nJoin here: ${event.meetingLink}` : "")

  return (
    <div className="absolute top-full left-0 mt-1 z-30 bg-card border rounded-xl shadow-lg p-3 w-56 text-xs" onClick={e => e.stopPropagation()}>
      <p className="font-semibold text-foreground mb-1">{event.studentName}</p>
      <p className="text-muted-foreground mb-2">{dateStr} · {timeStr} · {event.duration} min</p>
      {event.meetingLink && (
        <a href={event.meetingLink} target="_blank" rel="noopener noreferrer" className="block text-center border py-1 rounded-lg hover:bg-accent mb-2">Open Meeting Link</a>
      )}
      <div className="flex flex-col gap-2">
        <a href={waLink(event.studentPhone, message)} target="_blank" rel="noopener noreferrer" onClick={onClose}
          className="text-center bg-green-600 text-white py-1 rounded-lg hover:bg-green-700">Send WhatsApp Invite</a>
        <EmailInviteButton emails={event.studentEmails} subject="Chess Session Reminder" body={message}
          linkClassName="text-center border py-1 rounded-lg hover:bg-accent" />
      </div>
    </div>
  )
}

export function WeekCalendar({ privateEvents, groupEvents }: { privateEvents: PrivateEvent[]; groupEvents: GroupEvent[] }) {
  const [weekBase, setWeekBase] = useState(new Date())
  const [popover, setPopover] = useState<string | null>(null)
  const days = getWeekDays(weekBase)
  const studentColors: Record<string, string> = {}
  let colorIdx = 0

  return (
    <div>
      {/* Legend */}
      <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-500 inline-block"></span> Private session</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-teal-500 inline-block"></span> Group class (recurring)</span>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <button onClick={() => { const d = new Date(weekBase); d.setDate(d.getDate() - 7); setWeekBase(d) }}
            className="text-muted-foreground hover:text-foreground px-3 py-1 border rounded-lg text-sm">← Prev</button>
          <span className="font-semibold text-foreground">
            {days[0].toLocaleDateString("en-IN", { day: "numeric", month: "short" })} — {days[6].toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </span>
          <button onClick={() => { const d = new Date(weekBase); d.setDate(d.getDate() + 7); setWeekBase(d) }}
            className="text-muted-foreground hover:text-foreground px-3 py-1 border rounded-lg text-sm">Next →</button>
        </div>
        <div className="grid grid-cols-7 divide-x min-h-48" onClick={() => setPopover(null)}>
          {days.map((day, i) => {
            const isToday = day.toDateString() === new Date().toDateString()
            const dayOfWeek = day.getDay()

            const dayPrivate = privateEvents.filter(e => new Date(e.scheduledAt).toDateString() === day.toDateString())
            const dayGroup = groupEvents.filter(e => e.dayOfWeek === dayOfWeek)

            return (
              <div key={i} className={`p-2 ${isToday ? "bg-blue-50" : ""}`}>
                <div className={`text-center mb-2 ${isToday ? "font-bold text-blue-600" : "text-muted-foreground"}`}>
                  <div className="text-xs">{day.toLocaleDateString("en-IN", { weekday: "short" })}</div>
                  <div className={`text-lg ${isToday ? "w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto text-sm" : ""}`}>
                    {day.getDate()}
                  </div>
                </div>
                <div className="space-y-1">
                  {/* Group class slots */}
                  {dayGroup.map(gc => (
                    <div key={gc.id} className="relative">
                      <div
                        className="bg-teal-500 text-white rounded px-1.5 py-1 text-xs cursor-pointer hover:bg-teal-600"
                        onClick={e => { e.stopPropagation(); setPopover(popover === gc.id + day.toDateString() ? null : gc.id + day.toDateString()) }}
                      >
                        <div className="font-medium truncate">{gc.name.split(" ")[0]}</div>
                        <div className="opacity-80">{gc.startTime} · 👥{gc.enrolledCount}</div>
                      </div>
                      {popover === gc.id + day.toDateString() && (
                        <GroupPopover event={gc} day={day} onClose={() => setPopover(null)} />
                      )}
                    </div>
                  ))}
                  {/* Private sessions */}
                  {dayPrivate.map(ev => {
                    if (!studentColors[ev.studentId]) { studentColors[ev.studentId] = STUDENT_COLORS[colorIdx++ % STUDENT_COLORS.length] }
                    return (
                      <div key={ev.id} className="relative">
                        <div
                          className={`${studentColors[ev.studentId]} text-white rounded px-1.5 py-1 text-xs cursor-pointer`}
                          onClick={e => { e.stopPropagation(); setPopover(popover === ev.id ? null : ev.id) }}
                        >
                          <div className="font-medium truncate">{ev.studentName.split(" ")[0]}</div>
                          <div className="opacity-80">{new Date(ev.scheduledAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
                        </div>
                        {popover === ev.id && (
                          <PrivatePopover event={ev} onClose={() => setPopover(null)} />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
