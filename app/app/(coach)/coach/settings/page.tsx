import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { SettingsForm } from "./form"

export default async function SettingsPage() {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH") redirect("/login")
  const coach = await prisma.user.findUnique({ where: { email: session.user!.email! } })
  if (!coach) redirect("/login")

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-2">Settings</h1>
      <p className="text-muted-foreground text-sm mb-6">Payment details used for billing and UPI payment requests</p>

      <SettingsForm upiId={coach.upiId ?? ""} hourlyRate={coach.hourlyRate ?? 500} />
    </div>
  )
}
