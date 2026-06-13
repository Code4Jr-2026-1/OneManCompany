import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CoachNav } from "@/components/coach-nav"
import { prisma } from "@/lib/prisma"
import { NewGroupClassForm } from "./form"

export default async function NewGroupClassPage() {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH") redirect("/login")

  const coach = await prisma.user.findUnique({ where: { email: session.user!.email! } })
  if (!coach) redirect("/login")

  return (
    <div className="min-h-screen bg-gray-50">
      <CoachNav coachName={coach.name ?? "Coach"} />
      <div className="max-w-xl mx-auto px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">New Group Class</h1>
          <p className="text-gray-500 text-sm mt-1">Set up a recurring class for multiple students</p>
        </div>
        <NewGroupClassForm />
      </div>
    </div>
  )
}
