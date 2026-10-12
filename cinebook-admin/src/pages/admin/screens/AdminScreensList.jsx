import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { MonitorPlay, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import api, { errorMessage } from "../../../api/axios"
import { ConfirmDialog, Empty, PageHeader, TableSkeleton } from "../../../components/ui"

export default function AdminScreensList() {
  const [screens, setScreens] = useState(null)
  const [theaters, setTheaters] = useState([])
  const [theaterId, setTheaterId] = useState("")
  const [toDelete, setToDelete] = useState(null)
  const [busy, setBusy] = useState(false)

  const fetchScreens = (tid = theaterId) =>
    api.get("/screens", { params: tid ? { theaterId: tid } : {} })
      .then((res) => setScreens(res.data))
      .catch((err) => {
        toast.error(errorMessage(err))
        setScreens([])
      })

  useEffect(() => {
    api.get("/theaters").then((res) => setTheaters(res.data)).catch(() => {})
    fetchScreens("")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const deleteScreen = async () => {
    setBusy(true)
    try {
      await api.delete(`/screens/${toDelete.id}`)
      toast.success("Screen deleted")
      setToDelete(null)
      fetchScreens()
    } catch (err) {
      toast.error(errorMessage(err, "Could not delete screen"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Screens & seats"
        subtitle="Auditoriums and their seat layouts."
        actions={<Link to={`/admin/screens/add${theaterId ? `?theaterId=${theaterId}` : ""}`} className="btn-primary"><Plus size={16} /> Add screen</Link>}
      />

      <div className="card overflow-hidden">
        <div className="border-b border-line p-4">
          <select className="input max-w-xs" value={theaterId} onChange={(e) => { setTheaterId(e.target.value); fetchScreens(e.target.value) }}>
            <option value="">All theaters</option>
            {theaters.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        {!screens ? (
          <TableSkeleton />
        ) : screens.length === 0 ? (
          <Empty icon={MonitorPlay} title="No screens" text="Create a screen and design its seat map."
            action={<Link to="/admin/screens/add" className="btn-primary"><Plus size={16} /> Add screen</Link>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-line bg-surface-2/60">
                <tr>
                  <th className="table-th">Screen</th>
                  <th className="table-th">Theater</th>
                  <th className="table-th">Grid</th>
                  <th className="table-th">Seats</th>
                  <th className="table-th">Showtimes</th>
                  <th className="table-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {screens.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-2/40">
                    <td className="table-td">
                      <span className="font-semibold">{s.screenName}</span>
                      {s.format && <span className="ml-2 rounded bg-surface-2 px-1.5 py-0.5 text-xs font-semibold text-muted">{s.format}</span>}
                    </td>
                    <td className="table-td text-muted">{s.theaterName} · {s.city}</td>
                    <td className="table-td text-muted">{s.rows} × {s.columns}</td>
                    <td className="table-td font-semibold">{s.activeSeats}</td>
                    <td className="table-td">{s.hasShowtimes ? <span className="text-emerald-600">Scheduled</span> : <span className="text-faint">None</span>}</td>
                    <td className="table-td">
                      <div className="flex justify-end gap-1">
                        <Link to={`/admin/screens/edit/${s.id}`} className="btn-icon" title="Edit layout"><Pencil size={17} /></Link>
                        <button onClick={() => setToDelete(s)} className="btn-icon hover:text-red-600!" title="Delete"><Trash2 size={17} /></button>
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
        title="Delete screen?"
        message={`"${toDelete?.screenName}" and its seat layout will be deleted. Screens with showtimes can't be deleted.`}
        busy={busy}
        onConfirm={deleteScreen}
        onClose={() => setToDelete(null)}
      />
    </div>
  )
}
