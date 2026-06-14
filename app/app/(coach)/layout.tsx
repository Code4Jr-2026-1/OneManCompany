import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { SidebarNav } from "@/components/sidebar-nav"

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || (session.user as { role?: string }).role !== "COACH") redirect("/login")

  const coach = await prisma.user.findUnique({ where: { email: session.user!.email! } })

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <SidebarNav coachName={coach?.name ?? "Coach"} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
