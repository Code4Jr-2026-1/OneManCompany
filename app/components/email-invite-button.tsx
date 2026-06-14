"use client"
import { useState } from "react"
import { mailtoLink } from "@/lib/invite"

export function EmailInviteButton({ emails, subject, body, linkClassName }: { emails: string[]; subject: string; body: string; linkClassName: string }) {
  const [manualEmail, setManualEmail] = useState("")

  if (emails.length > 0) {
    return (
      <a href={mailtoLink(emails, subject, body)} className={linkClassName}>
        Send Email Invite
      </a>
    )
  }

  return (
    <div className="space-y-1">
      <p className="text-muted-foreground text-xs">No email on file — enter one to send an invite:</p>
      <div className="flex gap-1.5">
        <input
          type="email"
          value={manualEmail}
          onChange={e => setManualEmail(e.target.value)}
          placeholder="email@example.com"
          className="flex-1 border rounded-lg px-2 py-1 text-xs min-w-0"
        />
        <a href={mailtoLink(manualEmail ? [manualEmail] : [], subject, body)}
          className={`whitespace-nowrap px-2 ${manualEmail ? "" : "opacity-50 pointer-events-none"} ${linkClassName}`}>
          Send Email
        </a>
      </div>
    </div>
  )
}
