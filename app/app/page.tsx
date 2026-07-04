import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await auth()
  if (!session) redirect("/login")
  const role = (session.user as { role?: string }).role
  if (role === "COACH") redirect("/coach")
  if (role === "PARENT") redirect("/parent")
  if (role === "STUDENT") redirect("/student")
  redirect("/login")
}
