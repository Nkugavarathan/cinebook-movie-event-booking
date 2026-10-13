import { CalendarClock, MapPin, MonitorPlay } from "lucide-react"
import Poster from "./Poster"
import { SEAT_TYPES } from "../lib/seatTypes"
import { longDate, money, time12 } from "../lib/format"

/** Movie + show + seat breakdown used on checkout and ticket pages. */
export default function BookingSummary({ booking }) {
  const st = booking.showtime
  const groups = {}
  booking.seats.forEach((s) => {
    groups[s.type] = groups[s.type] || { count: 0, price: s.price, labels: [] }
    groups[s.type].count++
    groups[s.type].labels.push(s.label)
  })

  return (
    <div>
      <div className="flex gap-4">
        <div className="h-28 w-20 shrink-0 overflow-hidden rounded-xl border border-line">
          <Poster src={st.moviePosterUrl} title={st.movieTitle} className="h-full w-full" />
        </div>
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold leading-tight">{st.movieTitle}</h2>
          <div className="mt-2 space-y-1 text-sm text-muted">
            <p className="flex items-center gap-2"><CalendarClock size={15} />{longDate(st.showDate)} · {time12(st.startTime)}</p>
            <p className="flex items-center gap-2"><MapPin size={15} />{st.theaterName}</p>
            <p className="flex items-center gap-2"><MonitorPlay size={15} />{st.screenName}{st.format ? ` · ${st.format}` : ""}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3 border-t border-dashed border-line pt-5 text-sm">
        {Object.entries(groups).map(([type, g]) => (
          <div key={type} className="flex items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 font-medium">
                <span className={`h-2 w-2 rounded-full ${SEAT_TYPES[type]?.dot}`} />
                {g.count} × {SEAT_TYPES[type]?.label || type}
              </p>
              <p className="mt-0.5 pl-4 text-xs text-muted">{g.labels.join(", ")}</p>
            </div>
            <span className="font-medium tabular-nums">{money(g.price * g.count, booking.currency)}</span>
          </div>
        ))}
        {booking.promoCode && booking.discountAmount != null && (
          <>
            <div className="flex items-center justify-between border-t border-line pt-3 text-muted">
              <span>Subtotal</span>
              <span className="tabular-nums">{money(booking.subtotalAmount, booking.currency)}</span>
            </div>
            <div className="flex items-center justify-between text-emerald-400">
              <span>Promo <span className="font-mono font-semibold">{booking.promoCode}</span></span>
              <span className="font-semibold tabular-nums">-{money(booking.discountAmount, booking.currency)}</span>
            </div>
          </>
        )}
        <div className="flex items-center justify-between border-t border-line pt-4">
          <span className="font-semibold">Total</span>
          <span className="font-display text-2xl font-bold">{money(booking.totalAmount, booking.currency)}</span>
        </div>
      </div>
    </div>
  )
}
