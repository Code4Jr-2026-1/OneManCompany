/** Builds a UPI deep link (`upi://pay?...`) that opens any UPI app with the amount pre-filled. */
export function buildUpiLink(opts: { vpa: string; payeeName: string; amount: number; note: string }) {
  const params = new URLSearchParams({
    pa: opts.vpa,
    pn: opts.payeeName,
    am: opts.amount.toFixed(2),
    cu: "INR",
    tn: opts.note,
  })
  return `upi://pay?${params.toString()}`
}
