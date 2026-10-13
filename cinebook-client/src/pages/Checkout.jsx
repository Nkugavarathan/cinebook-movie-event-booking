import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { AlertTriangle, CreditCard, Lock, Mail, Phone, ShieldCheck, TimerOff, User, X } from "lucide-react"
import { toast } from "sonner"
import api, { errorMessage } from "../services/api"
import { useAuth } from "../context/AuthContext"
import BookingSummary from "../components/BookingSummary"
import PromoBox from "../components/PromoBox"
import Countdown from "../components/Countdown"
import { CheckoutSkeleton } from "../components/Skeletons"
import { EmptyState, Spinner } from "../components/ui"
import { money, parseDateTime } from "../lib/format"

const PHONE_KEY = "cinebook_contact_phone"
const PHONE_RE = /^\+?[0-9][0-9 ()-]{6,18}[0-9]$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(c) {
  const e = {}
  if (!c.name.trim()) e.name = "Enter the name for the ticket"
  if (!EMAIL_RE.test(c.email.trim())) e.email = "Enter a valid email address"
  if (!PHONE_RE.test(c.phone.trim())) e.phone = "Enter a valid mobile number, e.g. +94 77 123 4567"
  return e
}

function storedPhone() {
  try {
    return localStorage.getItem(PHONE_KEY) || ""
  } catch {
    return ""
  }
}

export default function Checkout() {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [error, setError] = useState(null)
  const [paymentsEnabled, setPaymentsEnabled] = useState(true)
  const [paying, setPaying] = useState(false)
  const [releasing, setReleasing] = useState(false)
  const [expired, setExpired] = useState(false)
  const { user } = useAuth()
  const [contact, setContact] = useState({ name: "", email: "", phone: "" })
  const [touched, setTouched] = useState({})
  const errors = validate(contact)

  useEffect(() => {
    api.get(`/bookings/${bookingId}`)
      .then((res) => {
        const b = res.data
        if (b.status === "CONFIRMED") return navigate(`/bookings/${b.id}`, { replace: true })
        setBooking(b)
        setContact({
          name: b.contactName || user?.name || "",
          email: b.contactEmail || user?.email || "",
          phone: b.contactPhone || storedPhone(),
        })
        setExpired(b.status !== "PENDING" || parseDateTime(b.expiresAt) < new Date())
      })
      .catch((err) => setError(errorMessage(err, "Booking not found")))
    api.get("/payments/config").then((res) => setPaymentsEnabled(res.data.enabled)).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, navigate])

  const onExpire = useCallback(() => setExpired(true), [])

  const pay = async (e) => {
    e.preventDefault()
    setTouched({ name: true, email: true, phone: true })
    if (Object.keys(errors).length) return
    setPaying(true)
    try {
      try {
        localStorage.setItem(PHONE_KEY, contact.phone.trim())
      } catch {
        /* not essential */
      }
      const res = await api.post(`/payments/checkout/${bookingId}`, {
        name: contact.name.trim(),
        email: contact.email.trim(),
        phone: contact.phone.trim(),
      })
      window.location.assign(res.data.url) // Stripe-hosted checkout page
    } catch (err) {
      toast.error(errorMessage(err, "Could not start payment"))
      // e.g. the promo code expired meanwhile: the server removed it, show the new total.
      if (err.response?.status === 409) {
        api.get(`/bookings/${bookingId}`).then((r) => setBooking(r.data)).catch(() => {})
      }
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
  if (!booking) return <CheckoutSkeleton />

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
            <PromoBox booking={booking} onChange={setBooking} />
          </div>

          <div className="space-y-4">
            <form onSubmit={pay} noValidate className="card p-6">
              <h3 className="font-display text-lg font-semibold">Contact details</h3>
              <p className="mt-1 text-sm text-muted">Your e-ticket and payment receipt are sent here.</p>

              <div className="mt-5 space-y-4">
                <Field id="c-name" label="Full name" icon={User} error={touched.name && errors.name}>
                  <input id="c-name" autoComplete="name" className="input pl-10" placeholder="Name on the ticket"
                    value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })}
                    onBlur={() => setTouched({ ...touched, name: true })} />
                </Field>
                <Field id="c-email" label="Email" icon={Mail} error={touched.email && errors.email}>
                  <input id="c-email" type="email" autoComplete="email" className="input pl-10" placeholder="you@example.com"
                    value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })}
                    onBlur={() => setTouched({ ...touched, email: true })} />
                </Field>
                <Field id="c-phone" label="Mobile number" icon={Phone} error={touched.phone && errors.phone}>
                  <input id="c-phone" type="tel" inputMode="tel" autoComplete="tel" className="input pl-10" placeholder="+94 77 123 4567"
                    value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                    onBlur={() => setTouched({ ...touched, phone: true })} />
                </Field>
              </div>

              <div className="mt-6 border-t border-line pt-5">
                <p className="text-sm text-muted">
                  Next you'll pay on Stripe's secure checkout by card, Apple Pay or Google Pay.
                </p>
                {!paymentsEnabled && (
                  <p className="mt-4 flex gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">
                    <AlertTriangle size={18} className="shrink-0" />
                    Online payments aren't configured on the server yet.
                  </p>
                )}
                <button type="submit" disabled={paying || !paymentsEnabled} className="btn-primary mt-5 w-full py-3.5 text-base">
                  {paying ? <Spinner size={18} /> : <CreditCard size={18} />}
                  {paying ? "Redirecting to Stripe..." : `Continue to pay ${money(booking.totalAmount, booking.currency)}`}
                </button>
                <div className="mt-4 flex items-center justify-center gap-4 text-xs text-faint">
                  <span className="flex items-center gap-1"><Lock size={12} /> SSL encrypted</span>
                  <span className="flex items-center gap-1"><ShieldCheck size={12} /> Powered by Stripe</span>
                </div>
              </div>
            </form>
            <button onClick={release} disabled={releasing || paying} className="btn-ghost w-full text-sm text-muted">
              {releasing ? <Spinner size={16} /> : <X size={16} />} Cancel and release seats
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ id, label, icon: Icon, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{label}</label>
      <div className="relative">
        <Icon size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
        {children}
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-brand">{error}</p>}
    </div>
  )
}
