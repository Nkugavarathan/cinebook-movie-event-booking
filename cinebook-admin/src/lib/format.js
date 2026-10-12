export function money(amount, currency = "usd") {
  if (amount == null) return "—"
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currency.toUpperCase() }).format(amount)
  } catch {
    return `${currency.toUpperCase()} ${Number(amount).toFixed(2)}`
  }
}

export function parseDate(iso) {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export function shortDate(iso) {
  return iso ? parseDate(iso).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }) : ""
}

export function time12(hhmm) {
  if (!hhmm) return ""
  const [h, m] = hhmm.split(":").map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
}

export function dateTime(value) {
  if (!value) return "—"
  const d = new Date(value.replace(/(\.\d{3})\d+/, "$1"))
  return d.toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })
}

export function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function rowLabel(n) {
  let s = ""
  while (n > 0) {
    const r = (n - 1) % 26
    s = String.fromCharCode(65 + r) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}
