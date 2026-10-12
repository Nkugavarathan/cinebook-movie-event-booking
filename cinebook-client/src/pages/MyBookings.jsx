import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { CalendarClock, ChevronRight, MapPin, Ticket } from "lucide-react"
import { toast } from "sonner"
import api, { errorMessage } from "../services/api"
import Poster from "../components/Poster"
import { BookingListSkeleton } from "../components/Skeletons"
import { EmptyState, StatusBadge } from "../components/ui"
import { longDate, money, parseDateTime, showStartsAt, time12 } from "../lib/format"

const TABS = [
  ["upcoming", "Upcoming"],
  ["past", "Past"],
  ["other", "Cancelled & unpaid"],
]

export default function MyBookings() {
  const [bookings, setBookings] = useState(null)
  const [tab, setTab] = useState("upcoming")

  useEffect(() => {
    api.get("/bookings/my")
      .then((res) => setBookings(res.data))
      .catch((err) => {
        toast.error(errorMessage(err, "Could not load your bookings"))
        setBookings([])
      })
  }, [])

  if (!bookings) return <BookingListSkeleton />

  const now = new Date()
  const groups = {
    upcoming: bookings.filter((b) => b.status === "CONFIRMED" && showStartsAt(b.showtime) > now)
      .sort((a, b) => showStartsAt(a.showtime) - showStartsAt(b.showtime)),
    past: bookings.filter((b) => b.status === "CONFIRMED" && showStartsAt(b.showtime) <= now),
    other: bookings.filter((b) => b.status !== "CONFIRMED"),
  }
  const list = groups[tab]

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-4xl font-bold tracking-tight">My tickets</h1>

      <div className="mt-6 inline-flex rounded-xl border border-line bg-surface p-1">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === key ? "bg-surface-2 text-ink" : "text-muted hover:text-ink"}`}
          >
            {label} <span className="ml-1 text-xs text-faint">{groups[key].length}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {list.length === 0 && (
          <EmptyState
            icon={Ticket}
            title={tab === "upcoming" ? "No upcoming shows" : "Nothing here"}
            text={tab === "upcoming" ? "When you book a movie, your tickets will show up here." : undefined}
            action={tab === "upcoming" && <Link to="/" className="btn-primary">Find a movie</Link>}
          />
        )}
        {list.map((b) => {
          const pendingLive = b.status === "PENDING" && parseDateTime(b.expiresAt) > now
          return (
            <Link
              key={b.id}
              to={pendingLive ? `/checkout/${b.id}` : `/bookings/${b.id}`}
              className="card group flex items-center gap-4 p-4 transition hover:border-faint"
            >
              <div className="h-24 w-16 shrink-0 overflow-hidden rounded-lg">
                <Poster src={b.showtime.moviePosterUrl} title={b.showtime.movieTitle} className="h-full w-full" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate font-display text-lg font-semibold">{b.showtime.movieTitle}</h3>
                  <StatusBadge status={b.status} />
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted"><CalendarClock size={14} />{longDate(b.showtime.showDate)} · {time12(b.showtime.startTime)}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted"><MapPin size={14} />{b.showtime.theaterName} · {b.showtime.screenName}</p>
                <p className="mt-1 text-xs text-faint">Seats {b.seatLabels} · {money(b.totalAmount, b.currency)} · {b.reference}</p>
              </div>
              {pendingLive ? (
                <span className="hidden rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white sm:block">Complete payment</span>
              ) : (
                <ChevronRight className="text-faint transition group-hover:translate-x-0.5 group-hover:text-ink" />
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
