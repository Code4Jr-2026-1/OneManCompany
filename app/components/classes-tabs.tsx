import Link from "next/link"

export function ClassesTabs({ active }: { active: "personal" | "group" }) {
  const tabs = [
    { key: "personal", label: "Personal Classes", href: "/coach/personal-classes" },
    { key: "group", label: "Group Classes", href: "/coach/group-classes" },
  ] as const

  return (
    <div className="flex gap-1 bg-secondary rounded-lg p-1 w-fit">
      {tabs.map(t => (
        <Link key={t.key} href={t.href}>
          <div className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            active === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}>
            {t.label}
          </div>
        </Link>
      ))}
    </div>
  )
}
