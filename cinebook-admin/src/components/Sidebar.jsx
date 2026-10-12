import { NavLink } from "react-router-dom"
import { Building2, CalendarClock, Clapperboard, Film, LayoutDashboard, MonitorPlay, Ticket, X } from "lucide-react"

const NAV = [
  ["/admin/dashboard", "Dashboard", LayoutDashboard],
  ["/admin/movies", "Movies", Film],
  ["/admin/theaters", "Theaters", Building2],
  ["/admin/screens", "Screens & Seats", MonitorPlay],
  ["/admin/showtimes", "Showtimes", CalendarClock],
  ["/admin/bookings", "Bookings", Ticket],
]

export default function AdminSidebar({ open, onClose }) {
  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-side text-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-linear-to-br from-brand to-amber-500">
              <Clapperboard size={18} />
            </span>
            <div>
              <p className="font-display text-lg font-bold leading-none">CineBook</p>
              <p className="mt-0.5 text-[11px] uppercase tracking-widest text-white/40">Admin</p>
            </div>
          </div>
          <button className="rounded-lg p-1.5 text-white/50 hover:text-white lg:hidden" onClick={onClose} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="mt-4 flex flex-1 flex-col gap-1 px-3">
          {NAV.map(([to, label, Icon]) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? "bg-brand text-white shadow-lg shadow-brand/30" : "text-white/60 hover:bg-side-2 hover:text-white"
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="m-3 rounded-xl bg-side-2 p-4 text-xs text-white/50">
          Client site:{" "}
          <a href="http://localhost:5173" target="_blank" rel="noreferrer" className="font-semibold text-white/80 hover:text-white">
            localhost:5173
          </a>
        </div>
      </aside>
    </>
  )
}
