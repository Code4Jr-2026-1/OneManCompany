"use client"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import QRCode from "qrcode"
import { buildUpiLink } from "@/lib/upi"

export default function PayPage() {
  const params = useSearchParams()
  const [qr, setQr] = useState<string | null>(null)

  const upi = params.get("upi") ?? ""
  const name = params.get("name") ?? "Coach"
  const amount = Number(params.get("amount") ?? "0")
  const note = params.get("note") ?? "Chess coaching fee"

  const link = buildUpiLink({ vpa: upi, payeeName: name, amount, note })

  useEffect(() => {
    if (!upi) return
    QRCode.toDataURL(link, { width: 240, margin: 1 }).then(setQr)
  }, [link, upi])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4 py-12">
      <div className="absolute inset-0 opacity-5 pointer-events-none"
        style={{ backgroundImage: "repeating-conic-gradient(#fff 0% 25%, transparent 0% 50%)", backgroundSize: "48px 48px" }} />

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Chess<span className="text-blue-400">Mate</span>
          </h1>
          <p className="text-slate-400 mt-2 text-sm">Payment Request</p>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl text-center">
          {!upi ? (
            <p className="text-slate-400 text-sm py-8">This payment link is invalid.</p>
          ) : (
            <>
              <p className="text-slate-300 text-sm mb-1">Pay to</p>
              <p className="text-white font-semibold text-lg mb-4">{name}</p>
              <p className="text-3xl font-bold text-white mb-1">₹{amount.toLocaleString()}</p>
              <p className="text-slate-400 text-xs mb-6">{note}</p>

              {qr && <img src={qr} alt="UPI QR code" className="mx-auto rounded-xl border border-white/10 bg-white p-2" />}

              <a href={link}
                className="block mt-6 bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-3 font-semibold transition-all shadow-lg shadow-blue-900/30">
                Pay with UPI App →
              </a>
              <p className="text-slate-500 text-xs mt-3">Scan the QR with any UPI app, or tap the button above on your phone.</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
