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
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <nav className="border-b border-white/10 px-6 py-4 flex items-center gap-4">
        <a href="/student" className="text-slate-400 hover:text-white text-sm">← Back</a>
        <span className="text-white font-semibold">AI Chess Mentor</span>
        <span className="text-xs bg-blue-600/30 text-blue-300 px-2 py-0.5 rounded-full">Personalised to you</span>
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
