import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { AddStudentForm } from "./form"

export default async function NewStudentPage() {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH") redirect("/login")
  const coach = await prisma.user.findUnique({ where: { email: session.user!.email! } })
  if (!coach) redirect("/login")
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Student</h1>
        <AddStudentForm coachId={coach.id} />
      </div>
    </div>
  )
}
