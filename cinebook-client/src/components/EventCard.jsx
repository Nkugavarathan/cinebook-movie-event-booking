import { Link } from "react-router-dom"
import { CalendarDays, MapPin } from "lucide-react"
import Poster from "./Poster"
import { dayChip, money } from "../lib/format"

export default function EventCard({ event }) {
  const next = event.nextDate ? dayChip(event.nextDate) : null

  return (
    <Link to={`/events/${event.id}`} className="card group flex flex-col overflow-hidden transition hover:-translate-y-1 hover:border-faint hover:shadow-2xl hover:shadow-black/20">
      <div className="relative aspect-4/3 overflow-hidden">
        <Poster src={event.posterUrl} title={event.name} className="h-full w-full transition duration-500 group-hover:scale-105" />
        {event.category && (
          <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur">
            {event.category}
          </span>
        )}
        {next && (
          <span className="absolute right-3 top-3 flex flex-col items-center rounded-xl bg-white px-2.5 py-1.5 text-center text-zinc-900 shadow-lg">
            <span className="text-[10px] font-bold uppercase text-brand">{next.month}</span>
            <span className="font-display text-xl font-bold leading-none">{next.day}</span>
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-display text-lg font-semibold leading-snug group-hover:text-brand">{event.name}</h3>
        {event.performer && <p className="mt-1 truncate text-sm text-muted">{event.performer}</p>}
        <div className="mt-3 space-y-1 text-xs text-muted">
          {event.venues && <p className="flex items-center gap-1.5 truncate"><MapPin size={13} />{event.venues}</p>}
          <p className="flex items-center gap-1.5">
            <CalendarDays size={13} />
            {event.upcomingShows > 0 ? `${event.upcomingShows} date${event.upcomingShows > 1 ? "s" : ""} available` : "Dates coming soon"}
          </p>
        </div>
        <div className="mt-auto flex items-center justify-between pt-4">
          <span className="text-sm">
            {event.fromPrice != null ? (
              <><span className="text-muted">From </span><span className="font-semibold">{money(event.fromPrice, event.currency)}</span></>
            ) : <span className="text-faint">-</span>}
          </span>
          <span className="rounded-lg bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand transition group-hover:bg-brand group-hover:text-white">
            Book now
          </span>
        </div>
      </div>
    </Link>
  )
}
