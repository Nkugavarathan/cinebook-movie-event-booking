import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  Accessibility, ArrowUpRight, AudioLines, Car, Check, Coffee, Glasses, MapPin, MonitorPlay, Navigation, Popcorn, Sparkles, UtensilsCrossed,
} from "lucide-react"

/** Icon for a facility name typed by the admin ("Parking", "Food Court", "Dolby Atmos"...). */
function facilityIcon(name) {
  const f = name.toLowerCase()
  if (f.includes("park")) return Car
  if (f.includes("wheel") || f.includes("access")) return Accessibility
  if (f.includes("atmos") || f.includes("dolby") || f.includes("sound")) return AudioLines
  if (f.includes("3d") || f.includes("imax")) return Glasses
  if (f.includes("cafe") || f.includes("coffee")) return Coffee
  if (f.includes("snack") || f.includes("popcorn")) return Popcorn
  if (f.includes("food") || f.includes("canteen") || f.includes("restaurant")) return UtensilsCrossed
  if (f.includes("recliner") || f.includes("vip") || f.includes("lounge")) return Sparkles
  return Check
}

const TONES = [
  "from-rose-500/25 via-fuchsia-500/10",
  "from-violet-500/25 via-indigo-500/10",
  "from-amber-500/25 via-orange-500/10",
  "from-sky-500/25 via-cyan-500/10",
  "from-emerald-500/25 via-teal-500/10",
]

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase()
}

function CinemaCard({ t }) {
  const facilities = (t.facilities || "").split(",").map((f) => f.trim()).filter(Boolean)
  const shown = facilities.slice(0, 5)
  const more = facilities.length - shown.length
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([t.name, t.address, t.city].filter(Boolean).join(", "))}`

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition duration-300 hover:-translate-y-1 hover:border-faint hover:shadow-[0_24px_50px_-28px_rgb(0_0_0/0.6)]">
      {/* banner */}
      <div className={`relative h-28 overflow-hidden bg-linear-to-br ${TONES[t.id % TONES.length]} to-transparent`}>
        {/* stylised screen and rows of seats */}
        <svg viewBox="0 0 320 112" className="absolute inset-0 h-full w-full text-ink/[0.07] transition duration-500 group-hover:text-ink/[0.11]" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <path d="M40 30 Q160 4 280 30" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          {[0, 1, 2, 3].map((r) => (
            <g key={r}>
              {Array.from({ length: 12 - r }).map((_, i) => (
                <rect key={i} x={62 + r * 8 + i * 17} y={50 + r * 15} width="11" height="9" rx="3" fill="currentColor" />
              ))}
            </g>
          ))}
        </svg>
        <span className="absolute left-4 top-4 grid h-12 w-12 place-items-center rounded-xl border border-line bg-surface/90 font-display text-base font-bold tracking-tight shadow-sm backdrop-blur">
          {initials(t.name)}
        </span>
        <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full border border-line bg-surface/85 px-2.5 py-1 text-[11px] font-semibold text-muted backdrop-blur">
          <MapPin size={11} /> {t.city}
        </span>
      </div>

      {/* body */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-semibold leading-snug">{t.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted">{t.address || t.city}</p>

        <div className="mt-4 flex items-center gap-2 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface-2 px-2.5 py-1 font-semibold">
            <MonitorPlay size={13} className="text-brand" />
            {t.screenCount} {t.screenCount === 1 ? "screen" : "screens"}
          </span>
        </div>

        {shown.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Facilities">
            {shown.map((f) => {
              const Icon = facilityIcon(f)
              return (
                <li key={f} className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2 py-1 text-xs text-muted">
                  <Icon size={13} className="shrink-0 text-faint" />
                  {f}
                </li>
              )
            })}
            {more > 0 && <li className="inline-flex items-center rounded-lg px-1.5 py-1 text-xs text-faint">+{more} more</li>}
          </ul>
        )}

        <div className="mt-auto flex gap-2 pt-5">
          <a href={maps} target="_blank" rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-line px-3 py-2.5 text-sm font-semibold transition hover:border-faint hover:bg-surface-2">
            <Navigation size={14} /> Directions
          </a>
          <Link to="/movies"
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl btn-primary px-3 py-2.5 text-sm font-semibold text-bg transition hover:opacity-85">
            Shows <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
    </article>
  )
}

export default function CinemasSection({ theaters }) {
  const cities = useMemo(() => [...new Set(theaters.map((t) => t.city).filter(Boolean))].sort(), [theaters])
  const [city, setCity] = useState("All")
  const list = city === "All" ? theaters : theaters.filter((t) => t.city === city)
  const screens = theaters.reduce((n, t) => n + (t.screenCount || 0), 0)

  if (!theaters.length) return null

  return (
    <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6" aria-labelledby="cinemas-title">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">Venues</p>
          <h2 id="cinemas-title" className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Our cinemas</h2>
          <p className="mt-2 max-w-xl text-muted">
            {theaters.length} {theaters.length === 1 ? "venue" : "venues"} and {screens} screens across {cities.length} {cities.length === 1 ? "city" : "cities"} - comfortable seats, great sound and easy parking.
          </p>
        </div>

        {cities.length > 1 && (
          <div className="no-scrollbar -mx-4 flex shrink-0 gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0" role="tablist" aria-label="Filter by city">
            {["All", ...cities].map((c) => {
              const count = c === "All" ? theaters.length : theaters.filter((t) => t.city === c).length
              const active = c === city
              return (
                <button key={c} role="tab" aria-selected={active} onClick={() => setCity(c)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    active ? "border-ink bg-ink text-bg" : "border-line bg-surface text-muted hover:border-faint hover:text-ink"}`}>
                  {c}
                  <span className={`rounded-full px-1.5 text-[11px] ${active ? "bg-bg/15" : "bg-surface-2"}`}>{count}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
        {list.map((t) => <CinemaCard key={t.id} t={t} />)}
      </div>
    </section>
  )
}
