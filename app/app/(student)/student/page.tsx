import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { PortalNav } from "@/components/portal-nav"
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
    <div className="min-h-screen bg-background">
      <PortalNav title="My Chess Portal" userName={user?.name} />

      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">Welcome, {user?.name?.split(" ")[0]} ♟</h1>
        <p className="text-muted-foreground mb-8 text-sm">
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
          <div className="bg-card border border-border shadow-sm rounded-xl p-5 mb-4">
            <h3 className="font-semibold text-foreground mb-4">📅 Upcoming Sessions</h3>
            <div className="space-y-3">
              {upcoming.map((item, i) => {
                const isToday = item.date.toDateString() === new Date().toDateString()
                return (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-24 text-xs text-muted-foreground flex-shrink-0">
                      <div>{isToday ? "Today" : fmtDay(item.date)}</div>
                      <div className="font-medium text-foreground">{fmtTime(item.date)}</div>
                    </div>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${item.kind === "group" ? "bg-teal-100 text-teal-700" : "bg-blue-100 text-blue-700"}`}>
                      {item.kind === "group" ? "👥" : "♟"}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{item.kind === "group" ? item.name : "Private Lesson"}</p>
                      <p className="text-xs text-muted-foreground">{item.duration} min</p>
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
            <div className="bg-card border border-border shadow-sm rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-4">📝 Pending Homework</h3>
              <div className="space-y-3">
                {student.homeworkAssignments.map(hw => (
                  <div key={hw.id} className="flex items-start gap-3">
                    <HomeworkToggle hwId={hw.id} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{hw.title}</p>
                      {hw.description && <p className="text-xs text-muted-foreground mt-0.5">{hw.description}</p>}
                      {hw.dueDate && <p className="text-xs text-muted-foreground">Due {new Date(hw.dueDate).toLocaleDateString()}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          {snapshot && (
            <div className="bg-card border border-border shadow-sm rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-4">This Month</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-2xl font-bold text-foreground">{student?.rating}</p><p className="text-muted-foreground text-sm">Rating</p></div>
                <div><p className="text-2xl font-bold text-foreground">{snapshot.sessionCount}</p><p className="text-muted-foreground text-sm">Sessions</p></div>
                <div><p className="text-2xl font-bold text-green-600">+{Math.round(snapshot.improvementRate)}%</p><p className="text-muted-foreground text-sm">Improvement</p></div>
              </div>
            </div>
          )}

          {/* Improvement plan */}
          {plan && milestones.length > 0 && (
            <div className="bg-card border border-border shadow-sm rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-3">Improvement Plan</h3>
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Milestones</span><span>{doneMilestones}/{milestones.length}</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden mb-4">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${milestones.length ? doneMilestones / milestones.length * 100 : 0}%` }} />
              </div>
              <div className="space-y-2">
                {milestones.map((m, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <MilestoneToggle planId={plan.id} index={i} done={m.done} milestones={milestones} />
                    <span className={`text-sm ${m.done ? "text-green-600 line-through" : "text-foreground"}`}>{m.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI context */}
          {student?.context && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-xl p-5">
              <p className="text-xs text-blue-600 mb-2 font-medium">✦ Your mentor knows you</p>
              <p className="text-sm text-foreground leading-relaxed">{student.context.contextSummary}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
