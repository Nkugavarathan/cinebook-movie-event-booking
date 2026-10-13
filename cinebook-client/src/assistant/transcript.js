import { money } from "../lib/format"

const time = (ms) => (ms ? new Date(ms).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : "")

/** Plain-text lines for the cards shown under a reply, so the transcript keeps the details. */
function cardLines(cards = []) {
  const out = []
  for (const c of cards) {
    if (c.type === "titles") {
      c.items.forEach((t) => out.push(`- ${t.title}${t.meta ? ` (${t.meta})` : ""}`))
    } else if (c.type === "showtimes") {
      c.items.forEach((s) => out.push(`- ${s.time}, ${s.day} - ${s.venue}${s.format ? `, ${s.format}` : ""} - from ${money(s.from, s.currency)}`))
    } else if (c.type === "booking" || c.type === "bookings") {
      const list = Array.isArray(c.items) ? c.items : [c.items]
      list.forEach((b) => out.push(`- Booking ${b.reference}: ${b.title}, ${b.when}, ${b.venue}. Seats ${b.seats}. Total ${money(b.total, b.currency)}`))
    }
  }
  return out.map((l) => `    ${l.replace(/·/g, "-")}`)
}

/** Saves the conversation as a .txt file. */
export function downloadTranscript(messages, user) {
  const now = new Date()
  const lines = [
    "CineBook Concierge - conversation",
    `Saved ${now.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}`,
    user ? `Customer: ${user.name} (${user.email})` : "Customer: guest",
    "",
  ]
  for (const m of messages) {
    const who = m.role === "user" ? `You${m.via === "voice" ? " (spoken)" : ""}` : "CineBook"
    const at = time(m.at)
    lines.push(`${at ? `[${at}] ` : ""}${who}: ${m.text}`)
    if (m.role === "assistant") lines.push(...cardLines(m.cards))
    lines.push("")
  }
  lines.push("Payments are made only on CineBook's secure checkout page.")

  const blob = new Blob([lines.join("\r\n")], { type: "text/plain;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  const pad = (n) => String(n).padStart(2, "0")
  a.href = url
  a.download = `cinebook-conversation-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}.txt`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
