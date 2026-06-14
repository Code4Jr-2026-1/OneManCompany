"use client"
import { useState } from "react"
import QRCode from "qrcode"
import { buildUpiLink } from "@/lib/upi"
import { waLink } from "@/lib/invite"

interface Props {
  upiId: string | null | undefined
  payeeName: string
  amount: number
  note: string
  studentName?: string
  studentPhone?: string | null
}

export function PayUpiButton({ upiId, payeeName, amount, note, studentName = "", studentPhone = null }: Props) {
  const [open, setOpen] = useState(false)
  const [qr, setQr] = useState<string | null>(null)

  if (!upiId) return null

  const link = buildUpiLink({ vpa: upiId, payeeName, amount, note })

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/pay?${new URLSearchParams({ upi: upiId, name: payeeName, amount: amount.toFixed(2), note }).toString()}`
    : ""
  const shareMessage = `Hi ${studentName}, here's your payment link for ₹${amount.toLocaleString()} (${note}). Tap to pay via UPI: ${shareUrl}`

  async function show() {
    const dataUrl = await QRCode.toDataURL(link, { width: 220, margin: 1 })
    setQr(dataUrl)
    setOpen(true)
  }

  return (
    <>
      <button onClick={show}
        className="text-xs bg-purple-50 text-purple-700 hover:bg-purple-100 px-2.5 py-1 rounded-lg font-medium">
        📱 Pay via UPI
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setOpen(false)}>
          <div className="bg-card border border-border rounded-xl shadow-xl p-6 w-full max-w-xs text-center" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-foreground mb-1">Scan to Pay</h3>
            <p className="text-sm text-muted-foreground mb-4">₹{amount.toLocaleString()} to {payeeName}</p>
            {qr && <img src={qr} alt="UPI QR code" className="mx-auto rounded-lg border" />}
            <a href={link} className="block mt-4 text-sm bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700">
              Open in UPI App
            </a>
            <a href={waLink(studentPhone, shareMessage)} target="_blank" rel="noopener noreferrer"
              className="block mt-2 text-sm bg-green-50 text-green-700 hover:bg-green-100 px-4 py-2 rounded-lg font-medium">
              💬 Share via WhatsApp
            </a>
            <button onClick={() => setOpen(false)} className="mt-2 w-full text-sm border px-3 py-2 rounded-lg hover:bg-accent">Close</button>
          </div>
        </div>
      )}
    </>
  )
}
