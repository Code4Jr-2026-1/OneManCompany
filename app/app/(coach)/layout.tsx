import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || session.user?.role !== "COACH") redirect("/login")
  return <div className="min-h-screen bg-gray-50">{children}</div>
}
