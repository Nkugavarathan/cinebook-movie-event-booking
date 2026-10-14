import { useEffect, useState } from "react"
import { Building2, DollarSign, Download, Film, Popcorn, TicketPercent, Ticket, Users } from "lucide-react"
import { toast } from "sonner"
import api, { errorMessage } from "../../../api/axios"
import { PageHeader, Spinner } from "../../../components/ui"
import { money, parseDate, todayIso } from "../../../lib/format"

function isoDaysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function monthStart() {
  return todayIso().slice(0, 8) + "01"
}

const PRESETS = [
  ["7d", "Last 7 days", () => [isoDaysAgo(6), todayIso()]],
  ["30d", "Last 30 days", () => [isoDaysAgo(29), todayIso()]],
  ["month", "This month", () => [monthStart(), todayIso()]],
  ["90d", "Last 90 days", () => [isoDaysAgo(89), todayIso()]],
]

const EXPORTS = [
  ["day", "By day"],
  ["listing", "By movie / event"],
  ["theater", "By theater"],
  ["bookings", "All bookings"],
]

export default function Reports() {
  const [preset, setPreset] = useState("30d")
  const [range, setRange] = useState(() => PRESETS[1][2]())
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(null)
  const [from, to] = range

  useEffect(() => {
    if (!from || !to || to < from) return
    setLoading(true)
    api.get("/reports/sales", { params: { from, to } })
      .then((res) => setReport(res.data))
      .catch((err) => toast.error(errorMessage(err, "Could not load the report")))
      .finally(() => setLoading(false))
  }, [from, to])

  const choose = (key) => {
    setPreset(key)
    setRange(PRESETS.find(([k]) => k === key)[2]())
  }

  const setDate = (i) => (e) => {
    setPreset("custom")
    const next = [...range]
    next[i] = e.target.value
    setRange(next)
  }

  const download = async (type) => {
    setDownloading(type)
    try {
      const res = await api.get("/reports/sales.csv", { params: { type, from, to }, responseType: "blob" })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement("a")
      a.href = url
      a.download = `cinebook-sales-${type}-${from}-to-${to}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error(errorMessage(err, "Could not export"))
    } finally {
      setDownloading(null)
    }
  }

  const cur = report?.currency || "lkr"
  const t = report?.totals

  return (
    <div>
      <PageHeader title="Reports" subtitle="Paid sales by the day they were paid. Refunded and unpaid bookings are not counted." />

      {/* Date range */}
      <div className="card mb-6 flex flex-wrap items-end gap-4 p-4">
        <div className="inline-flex flex-wrap rounded-lg bg-surface-2 p-1">
          {PRESETS.map(([key, label]) => (
            <button key={key} type="button" onClick={() => choose(key)}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${preset === key ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-end gap-2">
          <label className="text-xs text-muted">
            From
            <input type="date" className="input mt-1 py-1.5" value={from} max={to} onChange={setDate(0)} />
          </label>
          <label className="text-xs text-muted">
            To
            <input type="date" className="input mt-1 py-1.5" value={to} min={from} max={todayIso()} onChange={setDate(1)} />
          </label>
        </div>
        {loading && <Spinner size={18} className="mb-2 text-muted" />}
      </div>

      {!report ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-24" />)}
        </div>
      ) : (
        <div className={`space-y-6 transition-opacity ${loading ? "opacity-60" : ""}`}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[["Revenue", money(t.revenue, cur), DollarSign, "text-emerald-600 bg-emerald-50"],
              ["Paid bookings", t.bookings, Ticket, "text-brand bg-brand-soft"],
              ["Tickets sold", t.tickets, Users, "text-violet-600 bg-violet-50"],
              ["Snack sales", money(t.snackRevenue, cur), Popcorn, "text-amber-600 bg-amber-50"],
              ["Promo discounts", money(t.discounts, cur), TicketPercent, "text-sky-600 bg-sky-50"]].map(([label, value, Icon, tone]) => (
              <div key={label} className="card flex items-center gap-4 p-5">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone}`}><Icon size={20} /></span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted">{label}</p>
                  <p className="mt-0.5 truncate font-display text-xl font-bold">{value}</p>
                </div>
              </div>
            ))}
          </div>

          <DailyChart days={report.byDay} currency={cur} />

          <div className="grid gap-6 xl:grid-cols-2">
            <RankedTable
              title="Sales by movie / event"
              icon={Film}
              currency={cur}
              rows={report.byListing.map((r) => ({ key: `${r.kind}-${r.id}`, name: r.title, sub: r.kind === "EVENT" ? "Event" : "Movie", ...r }))}
              empty="No paid bookings in this period."
            />
            <RankedTable
              title="Sales by theater"
              icon={Building2}
              currency={cur}
              rows={report.byTheater.map((r) => ({ key: r.id, name: r.name, sub: r.city, ...r }))}
              empty="No paid bookings in this period."
            />
          </div>

          <div className="card p-5">
            <h2 className="font-semibold">Export to CSV</h2>
            <p className="text-xs text-muted">Opens in Excel or Google Sheets. Uses the dates selected above.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {EXPORTS.map(([type, label]) => (
                <button key={type} type="button" onClick={() => download(type)} disabled={downloading !== null} className="btn-secondary">
                  {downloading === type ? <Spinner size={16} /> : <Download size={16} />} {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** Rounds a raw axis step up to 1, 2 or 5 x 10^n. */
function niceStep(v) {
  const p = 10 ** Math.floor(Math.log10(v))
  const n = v / p
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p
}

/** Revenue per day, one bar per day, hover for the numbers. */
function DailyChart({ days, currency }) {
  const [hover, setHover] = useState(null)
  const max = Math.max(...days.map((x) => Number(x.revenue)), 0)
  const niceMax = max === 0 ? 100 : niceStep(max / 4) * 4
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => niceMax * f)
  // Label every day for a week, then thin the labels out so they don't overlap.
  const every = days.length <= 10 ? 1 : days.length <= 31 ? 5 : days.length <= 92 ? 14 : 30
  const short = (iso) => parseDate(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" })

  return (
    <div className="card p-5">
      <h2 className="font-semibold">Revenue by day</h2>
      <p className="text-xs text-muted">Hover a bar for the day's revenue, bookings and tickets</p>

      <div className="relative mt-6 h-60 pl-16">
        {ticks.map((tick) => (
          <div key={tick} className="absolute left-16 right-0 border-t border-line/70" style={{ bottom: `${(tick / niceMax) * 100}%` }}>
            <span className="absolute -left-16 -translate-y-1/2 pr-2 text-[10px] tabular-nums text-faint">
              {money(tick, currency).replace(/\.00$/, "")}
            </span>
          </div>
        ))}
        <div className="relative flex h-full items-end gap-px">
          {days.map((x, i) => {
            const h = (Number(x.revenue) / niceMax) * 100
            const label = parseDate(x.date).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })
            return (
              <div key={x.date} className="relative flex h-full flex-1 items-end justify-center"
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
                role="img" aria-label={`${label}: ${money(x.revenue, currency)}, ${x.bookings} bookings, ${x.tickets} tickets`}>
                <div className={`w-full max-w-10 rounded-t-sm transition-colors ${hover === i ? "bg-brand-600" : "bg-brand"}`}
                  style={{ height: `${Math.max(h, Number(x.revenue) > 0 ? 1.5 : 0)}%` }} />
                {hover === i && (
                  <div className={`pointer-events-none absolute z-10 whitespace-nowrap rounded-lg bg-ink px-3 py-2 text-xs text-white shadow-lg ${i > days.length / 2 ? "right-0" : "left-0"}`}
                    style={{ bottom: `calc(${h}% + 8px)` }}>
                    <p className="font-semibold">{label}</p>
                    <p>{money(x.revenue, currency)} · {x.bookings} bookings · {x.tickets} tickets</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      <div className="mt-2 flex gap-px pl-16">
        {days.map((x, i) => (
          <span key={x.date} className="flex-1 overflow-visible whitespace-nowrap text-center text-[11px] text-muted">
            {i % every === 0 ? short(x.date) : ""}
          </span>
        ))}
      </div>
    </div>
  )
}

/** Rows sorted by revenue, each with a bar showing its share of the top row. */
function RankedTable({ title, icon: Icon, rows, currency, empty }) {
  const top = Math.max(...rows.map((r) => Number(r.revenue)), 0)
  return (
    <div className="card p-5">
      <h2 className="flex items-center gap-2 font-semibold"><Icon size={17} className="text-muted" /> {title}</h2>
      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">{empty}</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-line">
                <th className="table-th pl-0">Name</th>
                <th className="table-th text-right">Bookings</th>
                <th className="table-th text-right">Tickets</th>
                <th className="table-th pr-0 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.key}>
                  <td className="table-td pl-0">
                    <p className="font-medium">{r.name}</p>
                    {r.sub && <p className="text-xs text-muted">{r.sub}</p>}
                    <div className="mt-1.5 h-1.5 w-full max-w-56 overflow-hidden rounded-full bg-surface-2">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${top ? (Number(r.revenue) / top) * 100 : 0}%` }} />
                    </div>
                  </td>
                  <td className="table-td text-right tabular-nums">{r.bookings}</td>
                  <td className="table-td text-right tabular-nums">{r.tickets}</td>
                  <td className="table-td pr-0 text-right font-semibold tabular-nums">{money(r.revenue, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
