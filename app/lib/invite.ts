export function waLink(phone: string | null | undefined, text: string) {
  const encoded = encodeURIComponent(text)
  return phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`
}

export function mailtoLink(emails: string[], subject: string, body: string) {
  const to = emails.filter(Boolean).join(",")
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
