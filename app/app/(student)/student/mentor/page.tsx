import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { MentorChat } from "./chat"

export default async function MentorPage() {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "STUDENT") redirect("/login")

  const user = await prisma.user.findUnique({ where: { email: session.user!.email! } })
  const student = user ? await prisma.student.findFirst({
    where: { userId: user.id },
    include: { context: true },
  }) : null

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="bg-card border-b border-border px-6 py-4 flex items-center gap-4">
        <a href="/student" className="text-muted-foreground hover:text-foreground text-sm">← Back</a>
        <span className="text-foreground font-semibold">AI Chess Mentor</span>
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Personalised to you</span>
      </nav>
      <MentorChat
        studentId={student?.id ?? null}
        studentName={user?.name ?? "Student"}
        context={student?.context?.contextSummary ?? ""}
        rating={student?.rating ?? 0}
        skillLevel={student?.skillLevel ?? "beginner"}
      />
    </div>
  )
}
