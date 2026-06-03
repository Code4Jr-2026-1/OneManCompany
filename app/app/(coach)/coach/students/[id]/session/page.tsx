import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { SessionForm } from "./form"

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH") redirect("/login")
  const student = await prisma.student.findUnique({ where: { id } })
  if (!student) redirect("/coach")
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Session Notes</h1>
        <p className="text-gray-500 mb-6">for {student.name}</p>
        <SessionForm studentId={id} studentName={student.name} />
      </div>
    </div>
  )
}
