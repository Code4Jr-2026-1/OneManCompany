"use client"
import { useState } from "react"
import { waLink, mailtoLink } from "@/lib/invite"

export function InviteStudentButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [link, setLink] = useState<string | null>(null)

  async function createInvite() {
    setLoading(true)
    setOpen(true)
    const res = await fetch("/api/coach/student-invites", { method: "POST" })
    const data = await res.json()
    setLink(`${window.location.origin}/join/${data.token}`)
    setLoading(false)
  }

  function close() {
    setOpen(false)
    setLink(null)
  }

  const message = link ? `Hi! Please fill out this short form so I can set up your ChessMate profile: ${link}` : ""

  return (
    <>
      <button onClick={createInvite} className="border px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent text-foreground">
        ✉ Invite Student
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={close}>
          <div className="bg-card border border-border rounded-xl shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-foreground mb-1">Invite a New Student</h3>
            <p className="text-sm text-muted-foreground mb-4">Share this link — the student fills in their details and it appears here for your approval. Valid for 7 days.</p>

            {loading ? (
              <p className="text-sm text-muted-foreground">Generating link…</p>
            ) : link ? (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <input readOnly value={link} className="flex-1 border rounded-lg px-3 py-2 text-sm bg-secondary" />
                  <button onClick={() => navigator.clipboard.writeText(link)} className="text-xs border px-3 py-2 rounded-lg hover:bg-accent">Copy</button>
                </div>
                <div className="flex gap-2">
                  <a href={waLink(null, message)} target="_blank" rel="noopener noreferrer"
                    className="flex-1 text-center text-sm bg-green-50 text-green-700 hover:bg-green-100 px-3 py-2 rounded-lg font-medium">
                    💬 Share via WhatsApp
                  </a>
                  <a href={mailtoLink([], "Join ChessMate — Onboarding Form", message)}
                    className="flex-1 text-center text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-2 rounded-lg font-medium">
                    ✉ Share via Email
                  </a>
                </div>
              </>
            ) : null}

            <button onClick={close} className="mt-4 w-full text-sm border px-3 py-2 rounded-lg hover:bg-accent">Close</button>
          </div>
        </div>
      )}
    </>
  )
}
