import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { CalendarClock, Grid3x3, Plus, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import api, { errorMessage } from "../../../api/axios"
import SeatGrid, { SeatGridLegend } from "../../../components/SeatGrid"
import { ConfirmDialog, Empty, Modal, PageHeader, TableSkeleton } from "../../../components/ui"
import { money, shortDate, time12 } from "../../../lib/format"

export default function AdminShowTimesList() {
  const [showTimes, setShowTimes] = useState(null)
  const [movies, setMovies] = useState([])
  const [events, setEvents] = useState([])
  const [theaters, setTheaters] = useState([])
  const [filters, setFilters] = useState({ kind: "", movieId: "", eventId: "", theaterId: "", date: "" })
  const [toDelete, setToDelete] = useState(null)
  const [busy, setBusy] = useState(false)
  const [occupancy, setOccupancy] = useState(null)

  const fetchShowTimes = useCallback(() => {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
    api.get("/showtimes", { params })
      .then((res) => setShowTimes(res.data))
      .catch((err) => {
        toast.error(errorMessage(err))
        setShowTimes([])
      })
  }, [filters])

  useEffect(() => {
    api.get("/movies").then((res) => setMovies(res.data)).catch(() => {})
    api.get("/events").then((res) => setEvents(res.data)).catch(() => {})
    api.get("/theaters").then((res) => setTheaters(res.data)).catch(() => {})
  }, [])

  useEffect(() => {
    fetchShowTimes()
  }, [fetchShowTimes])

  const deleteShowTime = async () => {
    setBusy(true)
    try {
      await api.delete(`/showtimes/${toDelete.id}`)
      toast.success("Showtime deleted")
      setToDelete(null)
      fetchShowTimes()
    } catch (err) {
      toast.error(errorMessage(err, "Could not delete showtime"))
    } finally {
      setBusy(false)
    }
  }

  const openOccupancy = async (st) => {
    try {
      const res = await api.get(`/showtimes/${st.id}/seats`)
      setOccupancy(res.data)
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const hasFilters = Object.values(filters).some(Boolean)

  return (
    <div>
      <PageHeader
        title="Showtimes"
        subtitle="Scheduled screenings and how full they are."
        actions={<Link to="/admin/showtimes/add" className="btn-primary"><Plus size={16} /> Schedule shows</Link>}
      />

      <div className="card overflow-hidden">
        <div className="flex flex-wrap gap-2 border-b border-line p-4">
          <select className="input w-auto" value={filters.kind}
            onChange={(e) => setFilters({ ...filters, kind: e.target.value, movieId: "", eventId: "" })}>
            <option value="">Movies & events</option>
            <option value="MOVIE">Movies only</option>
            <option value="EVENT">Events only</option>
          </select>
          {filters.kind !== "EVENT" && (
            <select className="input w-auto" value={filters.movieId} onChange={(e) => setFilters({ ...filters, movieId: e.target.value })}>
              <option value="">All movies</option>
              {movies.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
          )}
          {filters.kind !== "MOVIE" && (
            <select className="input w-auto" value={filters.eventId} onChange={(e) => setFilters({ ...filters, eventId: e.target.value })}>
              <option value="">All events</option>
              {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </select>
          )}
          <select className="input w-auto" value={filters.theaterId} onChange={(e) => setFilters({ ...filters, theaterId: e.target.value })}>
            <option value="">All theaters</option>
            {theaters.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <input type="date" className="input w-auto" value={filters.date} onChange={(e) => setFilters({ ...filters, date: e.target.value })} />
          {hasFilters && (
            <button className="btn-secondary" onClick={() => setFilters({ kind: "", movieId: "", eventId: "", theaterId: "", date: "" })}><X size={15} /> Clear</button>
          )}
        </div>

        {!showTimes ? (
          <TableSkeleton />
        ) : showTimes.length === 0 ? (
          <Empty icon={CalendarClock} title="No showtimes" text={hasFilters ? "Nothing matches these filters." : "Schedule a movie on a screen to open bookings."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-line bg-surface-2/60">
                <tr>
                  <th className="table-th">Movie / event</th>
                  <th className="table-th">When</th>
                  <th className="table-th">Where</th>
                  <th className="table-th">Prices (Std / Prem / VIP)</th>
                  <th className="table-th">Sold</th>
                  <th className="table-th">Checked in</th>
                  <th className="table-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {showTimes.map((st) => {
                  const sold = st.totalSeats - st.availableSeats
                  const pct = st.totalSeats ? Math.round((sold / st.totalSeats) * 100) : 0
                  return (
                    <tr key={st.id} className={`hover:bg-surface-2/40 ${st.bookable ? "" : "opacity-60"}`}>
                      <td className="table-td">
                        <div className="flex items-center gap-3">
                          {st.moviePosterUrl && <img src={st.moviePosterUrl} alt="" className="h-10 w-7 rounded object-cover" />}
                          <div>
                            <span className="font-semibold">{st.movieTitle}</span>
                            <span className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                              st.kind === "EVENT" ? "bg-violet-100 text-violet-700" : "bg-sky-100 text-sky-700"}`}>
                              {st.kind === "EVENT" ? st.category || "Event" : "Movie"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="table-td whitespace-nowrap">
                        <p className="font-medium">{shortDate(st.showDate)}</p>
                        <p className="text-xs text-muted">{time12(st.startTime)} – {time12(st.endTime)}{!st.bookable && " · past"}</p>
                      </td>
                      <td className="table-td">
                        <p className="font-medium">{st.theaterName}</p>
                        <p className="text-xs text-muted">{st.screenName}{st.format && ` · ${st.format}`}</p>
                      </td>
                      <td className="table-td whitespace-nowrap text-muted">
                        {money(st.priceStandard, st.currency)} / {money(st.pricePremium, st.currency)} / {money(st.priceVip, st.currency)}
                      </td>
                      <td className="table-td min-w-36">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                            <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs tabular-nums text-muted">{sold}/{st.totalSeats}</span>
                        </div>
                      </td>
                      <td className="table-td whitespace-nowrap text-sm tabular-nums">
                        {st.soldSeats ? (
                          <span className={st.checkedInSeats >= st.soldSeats ? "font-semibold text-emerald-600" : ""}>
                            {st.checkedInSeats} / {st.soldSeats}
                          </span>
                        ) : <span className="text-faint">-</span>}
                      </td>
                      <td className="table-td">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openOccupancy(st)} className="btn-icon" title="View seat occupancy"><Grid3x3 size={17} /></button>
                          <button onClick={() => setToDelete(st)} className="btn-icon hover:text-red-600!" title="Delete"><Trash2 size={17} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={!!occupancy}
        wide
        title={occupancy ? `${occupancy.showtime.movieTitle} - ${shortDate(occupancy.showtime.showDate)}, ${time12(occupancy.showtime.startTime)}` : ""}
        onClose={() => setOccupancy(null)}
      >
        {occupancy && (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted">{occupancy.showtime.theaterName} · {occupancy.showtime.screenName}</p>
              <SeatGridLegend withStatus />
            </div>
            <SeatGrid
              rows={occupancy.rows}
              columns={occupancy.columns}
              cells={new Map(occupancy.seats.map((s) => [`${s.row}:${s.col}`, { type: s.type, active: s.active, status: s.status }]))}
            />
          </>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete showtime?"
        message={toDelete ? `${toDelete.movieTitle} on ${shortDate(toDelete.showDate)} at ${time12(toDelete.startTime)} will be removed. Showtimes with bookings can't be deleted.` : ""}
        busy={busy}
        onConfirm={deleteShowTime}
        onClose={() => setToDelete(null)}
      />
    </div>
  )
}
