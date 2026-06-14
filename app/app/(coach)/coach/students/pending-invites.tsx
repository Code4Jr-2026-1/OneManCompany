"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export type PendingInvite = {
  id: string
  name: string | null
  age: number | null
  phone: string | null
  email: string | null
  skillLevel: string | null
  goals: string | null
  lichessId: string | null
  fideId: string | null
  aicfId: string | null
  stateId: string | null
  submittedAt: string | null
}

export function PendingInvites({ invites }: { invites: PendingInvite[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)

  async function act(id: string, action: "approve" | "reject") {
    setBusy(id)
    await fetch(`/api/coach/student-invites/${id}/${action}`, { method: "POST" })
    setBusy(null)
    router.refresh()
  }

  if (invites.length === 0) return null

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl shadow-sm mb-6">
      <div className="px-6 py-3 border-b border-amber-200">
        <h2 className="font-semibold text-amber-800">🔔 Pending Onboarding Requests ({invites.length})</h2>
      </div>
      <div className="divide-y divide-amber-200">
        {invites.map(inv => (
          <div key={inv.id} className="px-6 py-4 flex items-start justify-between gap-4">
            <div className="text-sm space-y-1">
              <p className="font-semibold text-foreground">{inv.name} {inv.age ? `· ${inv.age}y` : ""} <span className="text-muted-foreground capitalize">· {inv.skillLevel || "—"}</span></p>
              <p className="text-muted-foreground">
                {inv.phone && <span className="mr-3">📱 {inv.phone}</span>}
                {inv.email && <span>✉ {inv.email}</span>}
              </p>
              {inv.goals && <p className="text-muted-foreground">Goals: {inv.goals}</p>}
              {(inv.lichessId || inv.fideId || inv.aicfId || inv.stateId) && (
                <p className="text-muted-foreground text-xs">
                  {inv.lichessId && <span className="mr-3">Lichess: {inv.lichessId}</span>}
                  {inv.fideId && <span className="mr-3">FIDE: {inv.fideId}</span>}
                  {inv.aicfId && <span className="mr-3">AICF: {inv.aicfId}</span>}
                  {inv.stateId && <span>State: {inv.stateId}</span>}
                </p>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => act(inv.id, "approve")} disabled={busy === inv.id}
                className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">
                {busy === inv.id ? "…" : "✓ Approve"}
              </button>
              <button onClick={() => act(inv.id, "reject")} disabled={busy === inv.id}
                className="text-xs border px-3 py-1.5 rounded-lg font-medium hover:bg-accent disabled:opacity-50">
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
