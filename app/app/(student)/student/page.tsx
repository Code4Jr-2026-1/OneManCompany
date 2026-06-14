import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { SignOutButton } from "@/components/sign-out-button"
import { HomeworkToggle } from "./homework-toggle"
import { MilestoneToggle } from "./milestone-toggle"
import { buildUpcomingItems } from "@/lib/schedule"

export default async function StudentPortal() {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "STUDENT") redirect("/login")

  const user = await prisma.user.findUnique({ where: { email: session.user!.email! } })
  const student = user ? await prisma.student.findFirst({
    where: { userId: user.id },
    include: {
      context: true,
      snapshots: { orderBy: { month: "desc" }, take: 1 },
      plans: { where: { isActive: true }, take: 1 },
      homeworkAssignments: { where: { status: "PENDING" }, orderBy: { dueDate: "asc" } },
      scheduledSessions: { where: { scheduledAt: { gte: new Date() } }, orderBy: { scheduledAt: "asc" }, take: 5 },
      groupEnrollments: { where: { status: "ACTIVE" }, include: { groupClass: true } },
    },
  }) : null

  const snapshot = student?.snapshots[0]
  const plan = student?.plans[0]
  const milestones: { title: string; done: boolean }[] = plan ? JSON.parse(plan.milestones) : []
  const doneMilestones = milestones.filter(m => m.done).length

  const upcoming = student ? buildUpcomingItems({
    scheduledSessions: student.scheduledSessions,
    groupClasses: student.groupEnrollments.map(e => e.groupClass),
  }).slice(0, 5) : []
  const nextSession = upcoming[0]

  const fmtDay = (d: Date) => new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })
  const fmtTime = (d: Date) => new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-sm font-bold">♟</div>
          <span className="font-semibold">My Chess Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-400 text-sm">{user?.name}</span>
          <SignOutButton />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-1">Welcome, {user?.name?.split(" ")[0]} ♟</h1>
        <p className="text-slate-400 mb-8 text-sm">
          {student ? `${student.skillLevel} · Rating ${student.rating}` : "No student profile yet."}
          {nextSession ? ` · Next session ${fmtDay(nextSession.date)}` : ""}
        </p>

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { href: "/student/mentor", icon: "🤖", title: "AI Mentor", desc: "Chat with your chess mentor", bg: "from-blue-600 to-blue-700" },
            { href: "/student/analysis", icon: "🔍", title: "Game Analysis", desc: "Get AI feedback on your games", bg: "from-purple-600 to-purple-700" },
            { href: "/student/progress", icon: "📈", title: "My Progress", desc: "Rating & topic mastery", bg: "from-green-600 to-green-700" },
          ].map(a => (
            <Link key={a.href} href={a.href}>
              <div className={`bg-gradient-to-br ${a.bg} rounded-xl p-5 hover:opacity-90 transition-all cursor-pointer`}>
                <div className="text-2xl mb-2">{a.icon}</div>
                <h3 className="font-semibold">{a.title}</h3>
                <p className="text-sm opacity-75 mt-1">{a.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Upcoming sessions */}
        {upcoming.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-4">
            <h3 className="font-semibold mb-4">📅 Upcoming Sessions</h3>
            <div className="space-y-3">
              {upcoming.map((item, i) => {
                const isToday = item.date.toDateString() === new Date().toDateString()
                return (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-24 text-xs text-slate-400 flex-shrink-0">
                      <div>{isToday ? "Today" : fmtDay(item.date)}</div>
                      <div className="font-medium text-slate-300">{fmtTime(item.date)}</div>
                    </div>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${item.kind === "group" ? "bg-teal-500/20 text-teal-300" : "bg-blue-500/20 text-blue-300"}`}>
                      {item.kind === "group" ? "👥" : "♟"}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.kind === "group" ? item.name : "Private Lesson"}</p>
                      <p className="text-xs text-slate-400">{item.duration} min</p>
                    </div>
                    {item.meetingLink && (
                      <a href={item.meetingLink} target="_blank" rel="noopener noreferrer"
                        className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 flex-shrink-0">
                        Join →
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {/* Homework */}
          {student && student.homeworkAssignments.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="font-semibold mb-4">📝 Pending Homework</h3>
              <div className="space-y-3">
                {student.homeworkAssignments.map(hw => (
                  <div key={hw.id} className="flex items-start gap-3">
                    <HomeworkToggle hwId={hw.id} />
                    <div>
                      <p className="text-sm font-medium">{hw.title}</p>
                      {hw.description && <p className="text-xs text-slate-400 mt-0.5">{hw.description}</p>}
                      {hw.dueDate && <p className="text-xs text-slate-500">Due {new Date(hw.dueDate).toLocaleDateString()}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          {snapshot && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="font-semibold mb-4">This Month</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-2xl font-bold">{student?.rating}</p><p className="text-slate-400 text-sm">Rating</p></div>
                <div><p className="text-2xl font-bold">{snapshot.sessionCount}</p><p className="text-slate-400 text-sm">Sessions</p></div>
                <div><p className="text-2xl font-bold text-green-400">+{Math.round(snapshot.improvementRate)}%</p><p className="text-slate-400 text-sm">Improvement</p></div>
              </div>
            </div>
          )}

          {/* Improvement plan */}
          {plan && milestones.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <h3 className="font-semibold mb-3">Improvement Plan</h3>
              <div className="flex justify-between text-sm text-slate-400 mb-2">
                <span>Milestones</span><span>{doneMilestones}/{milestones.length}</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-4">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${milestones.length ? doneMilestones / milestones.length * 100 : 0}%` }} />
              </div>
              <div className="space-y-2">
                {milestones.map((m, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <MilestoneToggle planId={plan.id} index={i} done={m.done} milestones={milestones} />
                    <span className={`text-sm ${m.done ? "text-green-400 line-through" : "text-slate-300"}`}>{m.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI context */}
          {student?.context && (
            <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-500/20 rounded-xl p-5">
              <p className="text-xs text-blue-400 mb-2">✦ Your mentor knows you</p>
              <p className="text-sm text-slate-300 leading-relaxed">{student.context.contextSummary}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
