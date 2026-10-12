import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { CalendarPlus, PartyPopper, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"
import api, { errorMessage } from "../../../api/axios"
import { ConfirmDialog, Empty, PageHeader, TableSkeleton } from "../../../components/ui"
import { money, shortDate } from "../../../lib/format"

export default function EventsList() {
  const [events, setEvents] = useState(null)
  const [query, setQuery] = useState("")
  const [toDelete, setToDelete] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = () =>
    api.get("/events").then((res) => setEvents(res.data)).catch((err) => {
      toast.error(errorMessage(err))
      setEvents([])
    })

  useEffect(() => {
    load()
  }, [])

  const confirmDelete = async () => {
    setBusy(true)
    try {
      await api.delete(`/events/${toDelete.id}`)
      toast.success(`"${toDelete.name}" deleted`)
      setToDelete(null)
      load()
    } catch (err) {
      toast.error(errorMessage(err, "Could not delete event"))
    } finally {
      setBusy(false)
    }
  }

  const visible = (events || []).filter((e) =>
    [e.name, e.category, e.performer].some((v) => v?.toLowerCase().includes(query.toLowerCase()))
  )

  return (
    <div>
      <PageHeader
        title="Events"
        subtitle={events ? `${events.length} events` : "Loading..."}
        actions={<Link to="/admin/events/add" className="btn-primary"><Plus size={16} /> New event</Link>}
      />

      <div className="card overflow-hidden">
        <div className="border-b border-line p-4">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <input className="input pl-9" placeholder="Search name, category, performer" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>

        {!events ? (
          <TableSkeleton />
        ) : visible.length === 0 ? (
          <Empty icon={PartyPopper} title="No events" text="Create an event, then schedule its dates on a venue hall."
            action={<Link to="/admin/events/add" className="btn-primary"><Plus size={16} /> New event</Link>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-line bg-surface-2/60">
                <tr>
                  <th className="table-th">Event</th>
                  <th className="table-th">Category</th>
                  <th className="table-th">Next date</th>
                  <th className="table-th">Upcoming</th>
                  <th className="table-th">From</th>
                  <th className="table-th">Status</th>
                  <th className="table-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((e) => (
                  <tr key={e.id} className="hover:bg-surface-2/40">
                    <td className="table-td">
                      <div className="flex items-center gap-3">
                        {e.posterUrl ? (
                          <img src={e.posterUrl} alt="" className="h-11 w-14 shrink-0 rounded-md object-cover" />
                        ) : (
                          <div className="grid h-11 w-14 shrink-0 place-items-center rounded-md bg-surface-2 text-faint"><PartyPopper size={16} /></div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{e.name}</p>
                          <p className="truncate text-xs text-muted">{e.performer}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-td"><span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-semibold text-muted">{e.category}</span></td>
                    <td className="table-td text-muted">{e.nextDate ? shortDate(e.nextDate) : "-"}</td>
                    <td className="table-td"><span className={e.upcomingShows ? "font-semibold" : "text-faint"}>{e.upcomingShows}</span></td>
                    <td className="table-td text-muted">{e.fromPrice != null ? money(e.fromPrice, e.currency) : "-"}</td>
                    <td className="table-td">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                        e.active ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" : "bg-slate-100 text-slate-600 ring-slate-500/20"}`}>
                        {e.active ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="table-td">
                      <div className="flex justify-end gap-1">
                        <Link to={`/admin/showtimes/add?eventId=${e.id}`} className="btn-icon" title="Schedule dates"><CalendarPlus size={17} /></Link>
                        <Link to={`/admin/events/edit/${e.id}`} className="btn-icon" title="Edit"><Pencil size={17} /></Link>
                        <button onClick={() => setToDelete(e)} className="btn-icon hover:text-red-600!" title="Delete"><Trash2 size={17} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete event?"
        message={`"${toDelete?.name}" and its dates without bookings will be deleted. Events with bookings can't be deleted - mark them inactive instead.`}
        busy={busy}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  )
}
