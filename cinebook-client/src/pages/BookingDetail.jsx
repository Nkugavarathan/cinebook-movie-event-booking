import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { QRCodeSVG } from "qrcode.react"
import { AlertTriangle, ArrowLeft, Printer } from "lucide-react"
import api, { errorMessage } from "../services/api"
import Poster from "../components/Poster"
import { EmptyState, PageLoader, StatusBadge } from "../components/ui"
import { dateTimeShort, longDate, money, time12 } from "../lib/format"

export default function BookingDetail() {
  const { id } = useParams()
  const [b, setB] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get(`/bookings/${id}`).then((res) => setB(res.data)).catch((err) => setError(errorMessage(err, "Booking not found")))
  }, [id])

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <EmptyState icon={AlertTriangle} title="Ticket not found" text={error} action={<Link to="/bookings" className="btn-primary">My tickets</Link>} />
      </div>
    )
  }
  if (!b) return <PageLoader />

  const st = b.showtime
  const confirmed = b.status === "CONFIRMED"

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="no-print mb-6 flex items-center justify-between">
        <Link to="/bookings" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft size={16} /> My tickets</Link>
        {confirmed && (
          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><Printer size={16} /> Print</button>
        )}
      </div>

      {/* Ticket */}
      <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-2xl shadow-black/40">
        <div className="relative h-40">
          <Poster src={st.moviePosterUrl} title={st.movieTitle} className="h-full w-full object-top opacity-70" />
          <div className="absolute inset-0 bg-linear-to-t from-surface via-surface/40 to-transparent" />
          <div className="absolute bottom-4 left-5 right-5">
            <StatusBadge status={b.status} />
            <h1 className="mt-2 font-display text-2xl font-bold leading-tight">{st.movieTitle}</h1>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 px-5 pt-4 text-sm">
          <Field label="Date" value={longDate(st.showDate)} />
          <Field label="Time" value={time12(st.startTime)} />
          <Field label="Cinema" value={st.theaterName} />
          <Field label="Screen" value={`${st.screenName}${st.format ? " · " + st.format : ""}`} />
          <Field label="Seats" value={b.seatLabels} wide />
        </div>

        {/* Perforation */}
        <div className="relative my-5 flex items-center">
          <span className="absolute -left-3 h-6 w-6 rounded-full bg-bg" />
          <span className="mx-5 w-full border-t-2 border-dashed border-line" />
          <span className="absolute -right-3 h-6 w-6 rounded-full bg-bg" />
        </div>

        <div className="flex flex-col items-center px-5 pb-6">
          {confirmed ? (
            <>
              <div className="rounded-2xl bg-white p-3">
                <QRCodeSVG value={`CINEBOOK:${b.reference}`} size={168} level="M" />
              </div>
              <p className="mt-3 font-mono text-lg font-bold tracking-widest">{b.reference}</p>
              <p className="text-xs text-muted">Show this code at the entrance</p>
            </>
          ) : (
            <p className="py-4 text-center text-sm text-muted">
              {b.status === "PENDING" ? "This booking is waiting for payment." : `This booking is ${b.status.toLowerCase()} and can't be used for entry.`}
            </p>
          )}
          <div className="mt-5 flex w-full items-center justify-between border-t border-line pt-4 text-sm">
            <span className="text-muted">Paid</span>
            <span className="font-display text-lg font-bold">{money(b.totalAmount, b.currency)}</span>
          </div>
          {b.confirmedAt && <p className="mt-1 w-full text-right text-xs text-faint">Booked {dateTimeShort(b.confirmedAt)}</p>}
        </div>
      </div>

      {b.status === "PENDING" && (
        <Link to={`/checkout/${b.id}`} className="btn-primary no-print mt-6 w-full">Complete payment</Link>
      )}
    </div>
  )
}

function Field({ label, value, wide }) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <p className="text-xs uppercase tracking-wider text-faint">{label}</p>
      <p className="mt-0.5 font-semibold">{value}</p>
    </div>
  )
}
