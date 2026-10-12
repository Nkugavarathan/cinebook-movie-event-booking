import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Building2, CalendarClock, Clock, DollarSign, Film, Ticket, Users } from "lucide-react"
import { toast } from "sonner"
import api, { errorMessage } from "../api/axios"
import { PageHeader, StatusBadge } from "../components/ui"
import { dateTime, money, parseDate } from "../lib/format"

export default function AdminDashboard() {
  const [d, setD] = useState(null)

  useEffect(() => {
    api.get("/dashboard").then((res) => setD(res.data)).catch((err) => toast.error(errorMessage(err)))
  }, [])

  if (!d) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-28" />)}
      </div>
    )
  }

  const stats = [
    ["Revenue", money(d.totalRevenue, d.currency), DollarSign, "text-emerald-600 bg-emerald-50"],
    ["Confirmed bookings", d.confirmedBookings, Ticket, "text-brand bg-brand-soft"],
    ["Tickets sold", d.ticketsSold, Users, "text-violet-600 bg-violet-50"],
    ["Awaiting payment", d.pendingBookings, Clock, "text-amber-600 bg-amber-50"],
    ["Movies / events live", `${d.activeMovies} / ${d.activeEvents}`, Film, "text-sky-600 bg-sky-50"],
    ["Theaters / screens", `${d.theaters} / ${d.screens}`, Building2, "text-slate-600 bg-slate-100"],
    ["Upcoming showtimes", d.upcomingShowtimes, CalendarClock, "text-indigo-600 bg-indigo-50"],
    ["Registered users", d.users, Users, "text-pink-600 bg-pink-50"],
  ]

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Sales and activity across all CineBook cinemas." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value, Icon, tone]) => (
          <div key={label} className="card flex items-center gap-4 p-5">
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone}`}><Icon size={20} /></span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted">{label}</p>
              <p className="mt-0.5 truncate font-display text-2xl font-bold">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <RevenueChart days={d.last7Days} currency={d.currency} />

        <div className="card p-5">
          <h2 className="font-semibold">Top sellers</h2>
          <p className="text-xs text-muted">By confirmed revenue</p>
          <div className="mt-4 space-y-3">
            {d.topMovies.length === 0 && <p className="py-6 text-center text-sm text-muted">No sales yet.</p>}
            {d.topMovies.map((m, i) => (
              <div key={`${m.kind}-${m.id}`} className="flex items-center gap-3">
                <span className="w-4 text-sm font-bold text-faint">{i + 1}</span>
                {m.posterUrl ? <img src={m.posterUrl} alt="" className="h-12 w-8 rounded object-cover" /> : <div className="h-12 w-8 rounded bg-surface-2" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{m.title}</p>
                  <p className="text-xs text-muted">{m.kind === "EVENT" ? "Event" : "Movie"} · {m.tickets} tickets</p>
                </div>
                <span className="text-sm font-semibold tabular-nums">{money(m.revenue, d.currency)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card mt-6 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="font-semibold">Recent bookings</h2>
          <Link to="/admin/bookings" className="text-sm font-semibold text-brand hover:underline">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-y border-line bg-surface-2/60">
              <tr>
                <th className="table-th">Reference</th>
                <th className="table-th">Customer</th>
                <th className="table-th">Show</th>
                <th className="table-th">Seats</th>
                <th className="table-th">Amount</th>
                <th className="table-th">Status</th>
                <th className="table-th">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {d.recentBookings.length === 0 && (
                <tr><td colSpan={7} className="table-td py-10 text-center text-muted">No bookings yet.</td></tr>
              )}
              {d.recentBookings.map((b) => (
                <tr key={b.id} className="hover:bg-surface-2/50">
                  <td className="table-td font-mono text-xs font-semibold">{b.reference}</td>
                  <td className="table-td"><p className="font-medium">{b.userName}</p><p className="text-xs text-muted">{b.userEmail}</p></td>
                  <td className="table-td">{b.showtime.movieTitle}</td>
                  <td className="table-td text-muted">{b.seatLabels}</td>
                  <td className="table-td font-semibold tabular-nums">{money(b.totalAmount, b.currency)}</td>
                  <td className="table-td"><StatusBadge status={b.status} /></td>
                  <td className="table-td text-muted">{dateTime(b.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/** Rounds a raw axis step up to 1, 2 or 5 x 10^n. */
function niceStep(v) {
  const p = 10 ** Math.floor(Math.log10(v))
  const n = v / p
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p
}

/** Single-series bar chart: revenue per day for the last 7 days, with hover tooltips. */
function RevenueChart({ days, currency }) {
  const [hover, setHover] = useState(null)
  const max = Math.max(...days.map((x) => Number(x.revenue)), 0)
  const niceMax = max === 0 ? 100 : niceStep(max / 4) * 4
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => niceMax * f)
  const total = days.reduce((s, x) => s + Number(x.revenue), 0)

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-semibold">Revenue, last 7 days</h2>
          <p className="text-xs text-muted">Confirmed bookings by payment date</p>
        </div>
        <p className="font-display text-xl font-bold">{money(total, currency)}</p>
      </div>

      <div className="relative mt-6 h-56 pl-14">
        {/* grid + y axis */}
        {ticks.map((t) => (
          <div key={t} className="absolute left-14 right-0 border-t border-line/70" style={{ bottom: `${(t / niceMax) * 100}%` }}>
            <span className="absolute -left-14 -translate-y-1/2 pr-2 text-[10px] tabular-nums text-faint">
              {money(t, currency).replace(/\.00$/, "")}
            </span>
          </div>
        ))}
        <div className="relative flex h-full items-end gap-0.5">
          {days.map((x, i) => {
            const h = (Number(x.revenue) / niceMax) * 100
            const label = parseDate(x.date).toLocaleDateString(undefined, { weekday: "short", day: "numeric" })
            return (
              <div
                key={x.date}
                className="group relative flex h-full flex-1 items-end justify-center"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                role="img"
                aria-label={`${label}: ${money(x.revenue, currency)}, ${x.tickets} tickets`}
              >
                <div
                  className={`w-full max-w-12 rounded-t-sm transition-colors ${hover === i ? "bg-brand-600" : "bg-brand"}`}
                  style={{ height: `${Math.max(h, Number(x.revenue) > 0 ? 1.5 : 0)}%` }}
                />
                {hover === i && (
                  <div className="pointer-events-none absolute z-10 whitespace-nowrap rounded-lg bg-ink px-3 py-2 text-xs text-white shadow-lg"
                       style={{ bottom: `calc(${h}% + 8px)` }}>
                    <p className="font-semibold">{label}</p>
                    <p>{money(x.revenue, currency)} Â· {x.tickets} tickets</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      <div className="mt-2 flex gap-0.5 pl-14">
        {days.map((x) => (
          <span key={x.date} className="flex-1 text-center text-[11px] text-muted">
            {parseDate(x.date).toLocaleDateString(undefined, { weekday: "short" })}
          </span>
        ))}
      </div>
    </div>
  )
}
