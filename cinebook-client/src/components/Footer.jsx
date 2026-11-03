import { Link } from "react-router-dom"
import { Lock, ShieldCheck, Ticket } from "lucide-react"

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-surface/50">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Link to="/" className="inline-flex" aria-label="CineBook home">
            <img src="/logo-dark.png" alt="CineBook" className="h-10 w-auto light:hidden" />
            <img src="/logo-light.png" alt="CineBook" className="hidden h-10 w-auto light:block" />
          </Link>
          <p className="mt-3 max-w-sm text-sm text-muted">
            Pick your seat, pay securely and walk in with a QR ticket. Your next movie night is a few taps away.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Explore</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><Link className="hover:text-ink" to="/movies">Now showing</Link></li>
            <li><Link className="hover:text-ink" to="/events">Events</Link></li>
            <li><Link className="hover:text-ink" to="/bookings">My tickets</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Why CineBook</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li className="flex items-center gap-2"><Lock size={14} /> Payments by Stripe</li>
            <li className="flex items-center gap-2"><ShieldCheck size={14} /> Seats locked while you pay</li>
            <li className="flex items-center gap-2"><Ticket size={14} /> Instant QR e-tickets</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-5 text-center text-xs text-faint">
        © {new Date().getFullYear()} CineBook. All rights reserved.
      </div>
    </footer>
  )
}
