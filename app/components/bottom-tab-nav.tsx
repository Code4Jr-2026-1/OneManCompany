"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

const tabs = [
  { label: "Today",    href: "/coach",          exact: true,  icon: TodayIcon },
  { label: "Students", href: "/coach/students", exact: false, icon: StudentsIcon },
  { label: "Money",    href: "/coach/billing",  exact: false, icon: MoneyIcon },
]

export function BottomTabNav() {
  const path = usePathname()
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-50 safe-area-inset-bottom">
      {tabs.map(tab => {
        const active = tab.exact ? path === tab.href : path.startsWith(tab.href)
        const Icon = tab.icon
        return (
          <Link key={tab.href} href={tab.href} className="flex-1">
            <div className={`flex flex-col items-center justify-center py-3 gap-0.5 transition-colors ${active ? "text-blue-600" : "text-gray-400"}`}>
              <Icon active={active} />
              <span className={`text-xs font-medium ${active ? "text-blue-600" : "text-gray-400"}`}>{tab.label}</span>
            </div>
          </Link>
        )
      })}
    </nav>
  )
}

function TodayIcon({ active }: { active: boolean }) {
  const c = active ? "#2563eb" : "#9ca3af"
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <circle cx="8" cy="15" r="1" fill={c} stroke="none" />
      <circle cx="12" cy="15" r="1" fill={c} stroke="none" />
      <circle cx="8" cy="19" r="1" fill={c} stroke="none" />
    </svg>
  )
}

function StudentsIcon({ active }: { active: boolean }) {
  const c = active ? "#2563eb" : "#9ca3af"
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function MoneyIcon({ active }: { active: boolean }) {
  const c = active ? "#2563eb" : "#9ca3af"
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  )
}
