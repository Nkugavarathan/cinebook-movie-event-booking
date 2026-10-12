export function money(amount, currency = "usd") {
  if (amount == null) return ""
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: Number(amount) % 1 === 0 ? 0 : 2,
    }).format(amount)
  } catch {
    return `${currency.toUpperCase()} ${Number(amount).toFixed(2)}`
  }
}

/** "2026-10-14" -> Date at local midnight (avoids the UTC shift of new Date("YYYY-MM-DD")). */
export function parseDate(iso) {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export function longDate(iso) {
  return parseDate(iso).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" })
}

export function dayChip(iso) {
  const d = parseDate(iso)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((d - today) / 86400000)
  return {
    top: diff === 0 ? "Today" : diff === 1 ? "Tomorrow" : d.toLocaleDateString(undefined, { weekday: "short" }),
    day: d.getDate(),
    month: d.toLocaleDateString(undefined, { month: "short" }),
  }
}

export function time12(hhmm) {
  if (!hhmm) return ""
  const [h, m] = hhmm.split(":").map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
}

export function runtime(minutes) {
  if (!minutes) return ""
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h ? `${h}h ${m.toString().padStart(2, "0")}m` : `${m}m`
}

export function youtubeId(url) {
  if (!url) return null
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/)
  return m ? m[1] : null
}

export function showStartsAt(showtime) {
  const d = parseDate(showtime.showDate)
  const [h, m] = showtime.startTime.split(":").map(Number)
  d.setHours(h, m, 0, 0)
  return d
}

/** Server LocalDateTime ("2026-10-12T22:24:05.0120905") -> Date in the browser's zone. */
export function parseDateTime(value) {
  if (!value) return null
  return new Date(value.replace(/(\.\d{3})\d+/, "$1"))
}

export function dateTimeShort(value) {
  const d = parseDateTime(value)
  return d ? d.toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : ""
}
