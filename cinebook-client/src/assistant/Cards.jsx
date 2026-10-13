import { ArrowRight, Armchair, Clock, MapPin, Star } from "lucide-react"
import Poster from "../components/Poster"
import Countdown from "../components/Countdown"
import { StatusBadge } from "../components/ui"
import { money } from "../lib/format"

/** Rich results under an assistant message. Clicking a card opens the page or continues the conversation. */
export default function Cards({ cards, onOpen, onAsk }) {
  if (!cards?.length) return null
  return (
    <div className="mt-3 space-y-3">
      {cards.map((c) => {
        if (c.type === "titles") return <Titles key={c.type} items={c.items} onOpen={onOpen} />
        if (c.type === "showtimes") return <Showtimes key={c.type} items={c.items} onOpen={onOpen} onAsk={onAsk} />
        if (c.type === "booking") return <Booking key={c.type} b={c.items} onOpen={onOpen} />
        if (c.type === "bookings") {
          return (
            <div key={c.type} className="space-y-2">
              {c.items.map((b) => <Booking key={b.id} b={b} onOpen={onOpen} compact />)}
            </div>
          )
        }
        return null
      })}
    </div>
  )
}

function Titles({ items, onOpen }) {
  return (
    <div className="no-scrollbar -mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1">
      {items.map((t) => (
        <button key={`${t.kind}-${t.id}`} onClick={() => onOpen(t.path)}
          className="group w-[7.5rem] shrink-0 snap-start text-left focus-visible:outline-none">
          <div className="relative overflow-hidden rounded-xl border border-line bg-surface-2 transition group-hover:border-faint group-focus-visible:ring-2 group-focus-visible:ring-brand">
            <Poster src={t.poster} title={t.title} className="aspect-[2/3] w-full transition duration-300 group-hover:scale-[1.03]" />
            {t.rating != null && (
              <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
                <Star size={10} className="fill-gold text-gold" /> {t.rating}
              </span>
            )}
          </div>
          <p className="mt-1.5 line-clamp-1 text-[13px] font-semibold leading-tight">{t.title}</p>
          <p className="line-clamp-1 text-[11px] text-faint">{t.meta}</p>
        </button>
      ))}
    </div>
  )
}

function Showtimes({ items, onOpen, onAsk }) {
  const shown = items.slice(0, 6)
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      {shown.map((s, i) => (
        <div key={s.id} className={`flex items-center gap-3 px-3.5 py-3 ${i ? "border-t border-line" : ""}`}>
          <div className="w-[4.5rem] shrink-0">
            <p className="font-display text-[15px] font-semibold leading-tight tabular-nums">{s.time}</p>
            <p className="text-[11px] text-faint">{s.day}</p>
          </div>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-1 text-[13px] font-medium">{s.venue}</p>
            <p className="line-clamp-1 text-[11px] text-faint">
              {[s.format, `from ${money(s.from, s.currency)}`, s.seatsLeft < 25 ? `${s.seatsLeft} left` : null].filter(Boolean).join(" · ")}
            </p>
          </div>
          <div className="flex shrink-0 gap-1.5">
            <button onClick={() => onOpen(s.path)} title="Choose seats yourself"
              className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted transition hover:border-faint hover:text-ink">
              <Armchair size={15} />
            </button>
            <button onClick={() => onAsk(`I'll take the ${s.time} show on ${s.day} at ${s.venue}.`)}
              className="h-8 rounded-lg bg-ink px-3 text-xs font-semibold text-bg transition hover:opacity-85">
              Select
            </button>
          </div>
        </div>
      ))}
      {items.length > shown.length && (
        <p className="border-t border-line px-3.5 py-2 text-[11px] text-faint">+{items.length - shown.length} more - ask for a date, cinema or time to narrow it down</p>
      )}
    </div>
  )
}

function Booking({ b, onOpen, compact }) {
  const pending = b.status === "PENDING"
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <div className="flex gap-3 p-3">
        <Poster src={b.poster} title={b.title} className={`${compact ? "h-16 w-11" : "h-24 w-16"} shrink-0 rounded-lg`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-1 font-display text-[15px] font-semibold">{b.title}</p>
            {!pending && <StatusBadge status={b.status} />}
          </div>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted"><Clock size={12} /> {b.when}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted"><MapPin size={12} /> <span className="line-clamp-1">{b.venue}</span></p>
          <p className="mt-1 text-xs">
            <span className="text-faint">Seats </span><span className="font-semibold">{b.seats}</span>
            <span className="text-faint"> · </span><span className="font-semibold">{money(b.total, b.currency)}</span>
          </p>
        </div>
      </div>
      {pending ? (
        <div className="flex items-center justify-between gap-2 border-t border-line bg-surface-2/60 px-3 py-2.5">
          {b.expiresAt ? <Countdown until={b.expiresAt} /> : <span />}
          <button onClick={() => onOpen(b.path)} className="btn-primary px-3.5 py-2 text-sm">
            Pay now <ArrowRight size={15} />
          </button>
        </div>
      ) : (
        <button onClick={() => onOpen(b.path)}
          className="flex w-full items-center justify-between border-t border-line px-3 py-2 text-xs font-semibold text-muted transition hover:bg-surface-2 hover:text-ink">
          View ticket <ArrowRight size={14} />
        </button>
      )}
    </div>
  )
}
