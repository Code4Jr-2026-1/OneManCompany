import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session || session.user?.role !== "PARENT") redirect("/login")
  return <div className="min-h-screen bg-white">{children}</div>
}
