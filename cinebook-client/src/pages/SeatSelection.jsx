import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, CalendarClock, Info, MapPin, MonitorPlay, Ticket } from "lucide-react"
import { toast } from "sonner"
import api, { errorMessage } from "../services/api"
import { useAuth } from "../context/AuthContext"
import SeatMap, { SeatLegend } from "../components/SeatMap"
import { SEAT_TYPES } from "../lib/seatTypes"
import Poster from "../components/Poster"
import { SeatMapSkeleton } from "../components/Skeletons"
import { EmptyState, Spinner } from "../components/ui"
import { listingPath, longDate, money, time12 } from "../lib/format"

const draftKey = (id) => `cinebook_seats_${id}`

export default function SeatSelection() {
  const { showtimeId } = useParams()
  const { isAuthed } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [map, setMap] = useState(null)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(() => {
    try {
      return new Set(JSON.parse(sessionStorage.getItem(draftKey(showtimeId))) || [])
    } catch {
      return new Set()
    }
  })
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(
    (quiet) =>
      api.get(`/showtimes/${showtimeId}/seats`)
        .then((res) => {
          setMap(res.data)
          // Drop selections that someone else just took.
          setSelected((prev) => {
            const free = new Set(res.data.seats.filter((s) => s.active && s.status === "AVAILABLE").map((s) => s.id))
            const kept = new Set([...prev].filter((id) => free.has(id)))
            if (quiet && kept.size < prev.size) toast.warning("Some seats you picked were just taken by someone else.")
            return kept
          })
        })
        .catch((err) => !quiet && setError(errorMessage(err, "Showtime not found"))),
    [showtimeId]
  )

  useEffect(() => {
    load(false)
    const t = setInterval(() => load(true), 15000)
    return () => clearInterval(t)
  }, [load])

  useEffect(() => {
    sessionStorage.setItem(draftKey(showtimeId), JSON.stringify([...selected]))
  }, [selected, showtimeId])

  const seatById = useMemo(() => new Map((map?.seats || []).map((s) => [s.id, s])), [map])
  const chosen = [...selected].map((id) => seatById.get(id)).filter(Boolean)
    .sort((a, b) => a.row - b.row || a.col - b.col)
  const total = chosen.reduce((sum, s) => sum + Number(s.price), 0)

  const toggle = (seat) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(seat.id)) next.delete(seat.id)
      else if (next.size >= (map?.maxSeats || 10)) {
        toast.info(`You can select up to ${map?.maxSeats || 10} seats per booking.`)
        return prev
      } else next.add(seat.id)
      return next
    })
  }

  const proceed = async () => {
    if (!isAuthed) {
      toast.info("Sign in to book your seats - we'll keep your selection.")
      navigate("/login", { state: { from: location.pathname } })
      return
    }
    setSubmitting(true)
    try {
      const res = await api.post("/bookings", { showTimeId: Number(showtimeId), seatIds: [...selected] })
      sessionStorage.removeItem(draftKey(showtimeId))
      navigate(`/checkout/${res.data.id}`)
    } catch (err) {
      toast.error(errorMessage(err, "Could not hold your seats"))
      load(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <EmptyState icon={Ticket} title="Showtime unavailable" text={error} action={<Link to="/" className="btn-primary">Browse movies</Link>} />
      </div>
    )
  }
  if (!map) return <SeatMapSkeleton />

  const st = map.showtime
  const prices = { STANDARD: st.priceStandard, PREMIUM: st.pricePremium, VIP: st.priceVip }
  const presentTypes = new Set(map.seats.filter((s) => s.active).map((s) => s.type))
  Object.keys(prices).forEach((k) => !presentTypes.has(k) && delete prices[k])

  return (
    <div className="pb-36">
      {/* Show header */}
      <div className="border-b border-line bg-surface/60">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6">
          <button onClick={() => navigate(listingPath(st))} className="rounded-xl p-2 text-muted hover:bg-surface-2 hover:text-ink" aria-label="Back">
            <ArrowLeft size={20} />
          </button>
          <div className="hidden h-16 w-11 shrink-0 overflow-hidden rounded-lg sm:block">
            <Poster src={st.moviePosterUrl} title={st.movieTitle} className="h-full w-full" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-display text-xl font-bold">{st.movieTitle}</h1>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted sm:text-sm">
              <span className="flex items-center gap-1.5"><MapPin size={14} />{st.theaterName}</span>
              <span className="flex items-center gap-1.5"><MonitorPlay size={14} />{st.screenName}{st.format ? ` · ${st.format}` : ""}</span>
              <span className="flex items-center gap-1.5"><CalendarClock size={14} />{longDate(st.showDate)}, {time12(st.startTime)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {!st.bookable ? (
          <div className="mt-10">
            <EmptyState icon={Info} title="Booking closed" text="This show has already started or is no longer available." action={<Link to={listingPath(st)} className="btn-primary">Pick another time</Link>} />
          </div>
        ) : (
          <>
            <div className="mt-6">
              <SeatLegend prices={prices} currency={st.currency} />
            </div>
            <div className="card mt-6 px-2 py-8 sm:px-6">
              <SeatMap rows={map.rows} columns={map.columns} seats={map.seats} selected={selected} onToggle={toggle} />
            </div>
            <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-faint">
              <Info size={14} /> Seats are held for {map.holdMinutes} minutes once you continue to payment.
            </p>
          </>
        )}
      </div>

      {/* Summary bar */}
      {st.bookable && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="min-w-0">
              {chosen.length === 0 ? (
                <p className="text-sm text-muted">Tap seats on the map to select them.</p>
              ) : (
                <>
                  <p className="text-xs text-muted">{chosen.length} seat{chosen.length > 1 ? "s" : ""} selected</p>
                  <div className="no-scrollbar mt-1 flex gap-1.5 overflow-x-auto">
                    {chosen.map((s) => (
                      <span key={s.id} className="flex shrink-0 items-center gap-1 rounded-lg border border-line bg-surface-2 px-2 py-0.5 text-xs font-semibold">
                        <span className={`h-2 w-2 rounded-full ${SEAT_TYPES[s.type]?.dot}`} />{s.label}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center justify-between gap-5 sm:justify-end">
              <div className="text-right">
                <p className="text-xs text-muted">Total</p>
                <p className="font-display text-2xl font-bold">{money(total, st.currency)}</p>
              </div>
              <button onClick={proceed} disabled={chosen.length === 0 || submitting} className="btn-primary min-w-44">
                {submitting ? <Spinner size={18} /> : <Ticket size={18} />}
                {submitting ? "Holding seats..." : isAuthed ? "Continue to payment" : "Sign in to book"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
