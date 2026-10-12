import { useEffect, useRef, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { AlertTriangle, CheckCircle2, Clock, RotateCcw } from "lucide-react"
import api, { errorMessage } from "../services/api"
import { PageLoader } from "../components/ui"

/**
 * Stripe redirects here after checkout. The server verifies the session with Stripe itself
 * before confirming; we just poll until it reports a final state.
 */
export default function PaymentSuccess() {
  const [params] = useSearchParams()
  const sessionId = params.get("session_id")
  const [booking, setBooking] = useState(null)
  const [error, setError] = useState(sessionId ? null : "Missing payment session.")
  const [waiting, setWaiting] = useState(false)
  const attempts = useRef(0)

  useEffect(() => {
    if (!sessionId) return
    let timer
    const confirm = () =>
      api.post("/payments/confirm", { sessionId })
        .then((res) => {
          const b = res.data
          if (b.status === "PENDING" && attempts.current < 8) {
            attempts.current++
            setWaiting(true)
            timer = setTimeout(confirm, 2500)
          } else {
            setWaiting(false)
            setBooking(b)
          }
        })
        .catch((err) => setError(errorMessage(err, "We couldn't verify your payment.")))
    confirm()
    return () => clearTimeout(timer)
  }, [sessionId])

  if (error) {
    return (
      <Result icon={AlertTriangle} tone="text-amber-400 bg-amber-500/10" title="We couldn't confirm your payment" text={`${error} If you were charged, your ticket will appear in My Tickets shortly.`}>
        <Link to="/bookings" className="btn-primary">Go to My Tickets</Link>
      </Result>
    )
  }
  if (!booking) return <PageLoader label={waiting ? "Waiting for Stripe to confirm your payment..." : "Confirming your payment..."} />

  if (booking.status === "CONFIRMED") {
    return (
      <Result icon={CheckCircle2} tone="text-emerald-400 bg-emerald-500/10" title="You're all set!" text={`Payment received. Booking ${booking.reference} is confirmed for ${booking.showtime.movieTitle}.`}>
        <Link to={`/bookings/${booking.id}`} className="btn-primary">View my ticket</Link>
        <Link to="/" className="btn-ghost">Back to movies</Link>
      </Result>
    )
  }
  if (booking.status === "REFUNDED") {
    return (
      <Result icon={RotateCcw} tone="text-sky-400 bg-sky-500/10" title="Payment refunded" text="Your hold expired and the seats were taken before the payment arrived, so we refunded you in full. Sorry about that!">
        <Link to={`/book/${booking.showtime.id}`} className="btn-primary">Pick new seats</Link>
      </Result>
    )
  }
  return (
    <Result icon={Clock} tone="text-amber-400 bg-amber-500/10" title="Payment is still processing" text="Stripe hasn't confirmed this payment yet. We'll confirm your ticket as soon as it does — check My Tickets in a minute.">
      <Link to="/bookings" className="btn-primary">My tickets</Link>
    </Result>
  )
}

function Result({ icon: Icon, tone, title, text, children }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <span className={`grid h-20 w-20 place-items-center rounded-full ${tone}`}>
        <Icon size={40} />
      </span>
      <h1 className="mt-6 font-display text-3xl font-bold">{title}</h1>
      <p className="mt-3 text-muted">{text}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">{children}</div>
    </div>
  )
}
