import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { AlertTriangle, CreditCard, Lock, ShieldCheck, TimerOff, X } from "lucide-react"
import { toast } from "sonner"
import api, { errorMessage } from "../services/api"
import BookingSummary from "../components/BookingSummary"
import Countdown from "../components/Countdown"
import { EmptyState, PageLoader, Spinner } from "../components/ui"
import { money, parseDateTime } from "../lib/format"

export default function Checkout() {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [error, setError] = useState(null)
  const [paymentsEnabled, setPaymentsEnabled] = useState(true)
  const [paying, setPaying] = useState(false)
  const [releasing, setReleasing] = useState(false)
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    api.get(`/bookings/${bookingId}`)
      .then((res) => {
        const b = res.data
        if (b.status === "CONFIRMED") return navigate(`/bookings/${b.id}`, { replace: true })
        setBooking(b)
        setExpired(b.status !== "PENDING" || parseDateTime(b.expiresAt) < new Date())
      })
      .catch((err) => setError(errorMessage(err, "Booking not found")))
    api.get("/payments/config").then((res) => setPaymentsEnabled(res.data.enabled)).catch(() => {})
  }, [bookingId, navigate])

  const onExpire = useCallback(() => setExpired(true), [])

  const pay = async () => {
    setPaying(true)
    try {
      const res = await api.post(`/payments/checkout/${bookingId}`)
      window.location.assign(res.data.url) // Stripe-hosted checkout page
    } catch (err) {
      toast.error(errorMessage(err, "Could not start payment"))
      setPaying(false)
    }
  }

  const release = async () => {
    setReleasing(true)
    try {
      await api.post(`/bookings/${bookingId}/cancel`)
      toast.success("Seats released")
      navigate(`/book/${booking.showtime.id}`, { replace: true })
    } catch (err) {
      toast.error(errorMessage(err))
      setReleasing(false)
    }
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <EmptyState icon={AlertTriangle} title="Booking not found" text={error} action={<Link to="/bookings" className="btn-primary">My tickets</Link>} />
      </div>
    )
  }
  if (!booking) return <PageLoader />

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Booking {booking.reference}</p>
          <h1 className="font-display text-3xl font-bold tracking-tight">Review & pay</h1>
        </div>
        {!expired && <Countdown until={booking.expiresAt} onExpire={onExpire} />}
      </div>

      {expired ? (
        <div className="mt-8">
          <EmptyState
            icon={TimerOff}
            title="Your seat hold has ended"
            text="To be fair to other guests, seats are only held for a limited time. Your seats have been released and you have not been charged."
            action={<Link to={`/book/${booking.showtime.id}`} className="btn-primary">Choose seats again</Link>}
          />
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="card p-6">
            <BookingSummary booking={booking} />
          </div>

          <div className="space-y-4">
            <div className="card p-6">
              <h3 className="font-display text-lg font-semibold">Payment</h3>
              <p className="mt-1 text-sm text-muted">
                You'll be taken to Stripe's secure checkout to pay by card, Apple Pay or Google Pay.
              </p>
              {!paymentsEnabled && (
                <p className="mt-4 flex gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">
                  <AlertTriangle size={18} className="shrink-0" />
                  Online payments aren't configured on the server yet.
                </p>
              )}
              <button onClick={pay} disabled={paying || !paymentsEnabled} className="btn-primary mt-5 w-full py-3.5 text-base">
                {paying ? <Spinner size={18} /> : <CreditCard size={18} />}
                {paying ? "Redirecting to Stripe..." : `Pay ${money(booking.totalAmount, booking.currency)}`}
              </button>
              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-faint">
                <span className="flex items-center gap-1"><Lock size={12} /> SSL encrypted</span>
                <span className="flex items-center gap-1"><ShieldCheck size={12} /> Powered by Stripe</span>
              </div>
            </div>
            <button onClick={release} disabled={releasing || paying} className="btn-ghost w-full text-sm text-muted">
              {releasing ? <Spinner size={16} /> : <X size={16} />} Cancel and release seats
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
