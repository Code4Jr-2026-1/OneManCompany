"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { ChessMateMark, ChessMateWordmark } from "@/components/chessmate-logo"

const tabs = [
  { label: "Today",    href: "/coach",                    icon: "🏠" },
  { label: "Students", href: "/coach/students",           icon: "👥" },
  { label: "Personal", href: "/coach/personal-classes",   icon: "🎯" },
  { label: "Group",    href: "/coach/group-classes",      icon: "👥" },
  { label: "Schedule", href: "/coach/schedule",           icon: "📅" },
  { label: "Homework", href: "/coach/homework",           icon: "📝" },
  { label: "Reports",  href: "/coach/reports",            icon: "📊" },
  { label: "Billing",  href: "/coach/billing",            icon: "💰" },
]

export function CoachNav({ coachName }: { coachName: string }) {
  const path = usePathname()

  return (
    <nav className="bg-white border-b">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5 mr-4">
              <ChessMateMark size={32} />
              <div className="hidden sm:block">
                <ChessMateWordmark size="sm" />
              </div>
            </div>
            {tabs.map(t => {
              const active = t.href === "/coach" ? path === "/coach" : path.startsWith(t.href)
              return (
                <Link key={t.href} href={t.href}
                  className={`flex items-center gap-1.5 text-sm font-medium pb-0.5 border-b-2 transition-colors ${
                    active ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-900"
                  }`}>
                  <span className="text-base">{t.icon}</span>
                  <span className="hidden md:block">{t.label}</span>
                </Link>
              )
            })}
          </div>
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs">
              {coachName.split(" ").map(n => n[0]).join("").slice(0,2)}
            </div>
            <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-xs text-gray-400 hover:text-gray-600">Sign out</button>
          </div>
        </div>
      </div>
    </nav>
  )
}
