import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ClassesTabs } from "@/components/classes-tabs"

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export default async function GroupClassesPage() {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH") redirect("/login")

  const coach = await prisma.user.findUnique({ where: { email: session.user!.email! } })
  if (!coach) redirect("/login")

  const classes = await prisma.groupClass.findMany({
    where: { coachId: coach.id, isActive: true },
    include: {
      enrollments: { where: { status: "ACTIVE" } },
      _count: { select: { sessions: true } },
    },
    orderBy: { dayOfWeek: "asc" },
  })

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-1">Classes</h1>
          <p className="text-muted-foreground text-sm mb-4">Manage your private and group sessions</p>
          <ClassesTabs active="group" />
        </div>

        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground text-sm">{classes.length} active group class{classes.length !== 1 ? "es" : ""}</p>
          <Link href="/coach/group-classes/new">
            <button className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700">
              + New Group Class
            </button>
          </Link>
        </div>

        {classes.length === 0 ? (
          <div className="bg-card border border-border rounded-xl shadow-sm px-6 py-16 text-center">
            <div className="text-4xl mb-3">👥</div>
            <h2 className="font-semibold text-foreground mb-1">No group classes yet</h2>
            <p className="text-muted-foreground text-sm mb-4">Create your first group class to teach multiple students together.</p>
            <Link href="/coach/group-classes/new">
              <button className="bg-teal-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-teal-700">
                + New Group Class
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {classes.map(gc => (
              <Link key={gc.id} href={`/coach/group-classes/${gc.id}`}>
                <div className="bg-card border border-border rounded-xl shadow-sm hover:border-teal-300 hover:shadow-sm transition-all cursor-pointer">
                  <div className="px-6 py-5 flex items-center gap-5">
                    <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-teal-700 font-bold text-lg">👥</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h2 className="font-semibold text-foreground">{gc.name}</h2>
                        <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full capitalize">{gc.skillLevel}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Every {DAYS[gc.dayOfWeek]} at {gc.startTime} · {gc.duration} min
                      </p>
                    </div>
                    <div className="flex items-center gap-8 text-center flex-shrink-0">
                      <div>
                        <p className="text-lg font-bold text-foreground">{gc.enrollments.length}<span className="text-muted-foreground font-normal text-sm">/{gc.capacity}</span></p>
                        <p className="text-xs text-muted-foreground">enrolled</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-foreground">{gc._count.sessions}</p>
                        <p className="text-xs text-muted-foreground">sessions</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-teal-700">₹{gc.groupRate}</p>
                        <p className="text-xs text-muted-foreground">per session</p>
                      </div>
                    </div>
                    <span className="text-muted-foreground text-xl ml-2">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
    </div>
  )
}
