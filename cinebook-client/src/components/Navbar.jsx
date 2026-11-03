import { useEffect, useRef, useState } from "react"
import { Link, NavLink, useNavigate } from "react-router-dom"
import { LogOut, Menu, Ticket, User, X } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import ThemeToggle from "./ThemeToggle"

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? "text-ink bg-surface-2" : "text-muted hover:text-ink"}`

export default function Navbar() {
  const { user, isAuthed, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [menu, setMenu] = useState(false)
  const menuRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const close = (e) => menuRef.current && !menuRef.current.contains(e.target) && setMenu(false)
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [])

  const doLogout = () => {
    logout()
    setMenu(false)
    setOpen(false)
    navigate("/")
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-line/60 bg-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center" onClick={() => setOpen(false)} aria-label="CineBook home">
          <img src="/logo-dark.png" alt="CineBook" className="h-9 w-auto light:hidden" />
          <img src="/logo-light.png" alt="CineBook" className="hidden h-9 w-auto light:block" />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <NavLink to="/" end className={linkClass}>Home</NavLink>
          <NavLink to="/movies" className={linkClass}>Movies</NavLink>
          <NavLink to="/events" className={linkClass}>Events</NavLink>
          {isAuthed && <NavLink to="/bookings" className={linkClass}>My Tickets</NavLink>}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          {isAuthed ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenu((m) => !m)}
                className="flex items-center gap-2 rounded-full border border-line bg-surface-2 py-1 pl-1 pr-3 text-sm transition hover:border-faint"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-brand text-xs font-bold text-white">
                  {(user?.name || "U").charAt(0).toUpperCase()}
                </span>
                <span className="max-w-32 truncate">{user?.name}</span>
              </button>
              {menu && (
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-surface shadow-2xl">
                  <div className="border-b border-line px-4 py-3">
                    <p className="text-sm font-semibold">{user?.name}</p>
                    <p className="truncate text-xs text-muted">{user?.email}</p>
                  </div>
                  <Link to="/bookings" onClick={() => setMenu(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted hover:bg-surface-2 hover:text-ink">
                    <Ticket size={16} /> My tickets
                  </Link>
                  <button onClick={doLogout} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-muted hover:bg-surface-2 hover:text-ink">
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-muted hover:text-ink">Sign in</Link>
              <Link to="/register" className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600">Get started</Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button className="rounded-lg p-2 text-muted hover:text-ink" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line bg-surface px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            <NavLink to="/" end className={linkClass} onClick={() => setOpen(false)}>Home</NavLink>
            <NavLink to="/movies" className={linkClass} onClick={() => setOpen(false)}>Movies</NavLink>
            <NavLink to="/events" className={linkClass} onClick={() => setOpen(false)}>Events</NavLink>
            {isAuthed ? (
              <>
                <NavLink to="/bookings" className={linkClass} onClick={() => setOpen(false)}>My Tickets</NavLink>
                <button onClick={doLogout} className="rounded-lg px-3 py-2 text-left text-sm font-medium text-muted hover:text-ink">
                  Sign out ({user?.name})
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={linkClass} onClick={() => setOpen(false)}>
                  <span className="inline-flex items-center gap-2"><User size={16} /> Sign in</span>
                </NavLink>
                <Link to="/register" onClick={() => setOpen(false)} className="btn-primary mt-2 py-2.5 text-sm">Create account</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
