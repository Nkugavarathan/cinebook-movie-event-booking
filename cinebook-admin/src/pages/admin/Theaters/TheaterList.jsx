import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Building2, ChevronRight, MapPin, MonitorPlay, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import api, { errorMessage } from "../../../api/axios"
import { ConfirmDialog, Empty, PageHeader } from "../../../components/ui"
import TheaterFormModal from "./AddTheater"

export default function TheaterList() {
  const [theaters, setTheaters] = useState(null)
  const [editing, setEditing] = useState(undefined) // undefined = closed, null = new
  const [toDelete, setToDelete] = useState(null)
  const [busy, setBusy] = useState(false)

  const fetchTheaters = () =>
    api.get("/theaters").then((res) => setTheaters(res.data)).catch((err) => {
      toast.error(errorMessage(err))
      setTheaters([])
    })

  useEffect(() => {
    fetchTheaters()
  }, [])

  const handleDelete = async () => {
    setBusy(true)
    try {
      await api.delete(`/theaters/${toDelete.id}`)
      toast.success("Theater deleted")
      setToDelete(null)
      fetchTheaters()
    } catch (err) {
      toast.error(errorMessage(err, "Could not delete theater"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Theaters"
        subtitle="Cinemas and their locations."
        actions={<button onClick={() => setEditing(null)} className="btn-primary"><Plus size={16} /> Add theater</button>}
      />

      {!theaters ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-40" />)}</div>
      ) : theaters.length === 0 ? (
        <div className="card">
          <Empty icon={Building2} title="No theaters yet" text="Add a theater, then design its screens and seats."
            action={<button onClick={() => setEditing(null)} className="btn-primary"><Plus size={16} /> Add theater</button>} />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {theaters.map((t) => (
            <div key={t.id} className="card flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"><Building2 size={20} /></span>
                  <div>
                    <h3 className="font-semibold">{t.name}</h3>
                    <p className="mt-0.5 flex items-center gap-1 text-sm text-muted"><MapPin size={13} />{t.city}</p>
                  </div>
                </div>
                <div className="flex">
                  <button className="btn-icon" title="Edit" onClick={() => setEditing(t)}><Pencil size={16} /></button>
                  <button className="btn-icon hover:text-red-600!" title="Delete" onClick={() => setToDelete(t)}><Trash2 size={16} /></button>
                </div>
              </div>
              {t.address && <p className="mt-3 text-sm text-muted">{t.address}</p>}
              {t.facilities && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {t.facilities.split(",").map((f) => f.trim()).filter(Boolean).map((f) => (
                    <span key={f} className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted">{f}</span>
                  ))}
                </div>
              )}
              <Link to={`/admin/theaters/${t.id}`} className="mt-auto flex items-center justify-between border-t border-line pt-4 text-sm font-medium hover:text-brand">
                <span className="mt-4 flex items-center gap-2"><MonitorPlay size={16} />{t.screenCount} screen{t.screenCount === 1 ? "" : "s"}</span>
                <ChevronRight size={16} className="mt-4" />
              </Link>
            </div>
          ))}
        </div>
      )}

      <TheaterFormModal
        open={editing !== undefined}
        theater={editing}
        onClose={() => setEditing(undefined)}
        onSaved={() => {
          setEditing(undefined)
          fetchTheaters()
        }}
      />
      <ConfirmDialog
        open={!!toDelete}
        title="Delete theater?"
        message={`"${toDelete?.name}" and all of its screens will be deleted. This is blocked if any screen still has showtimes.`}
        busy={busy}
        onConfirm={handleDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  )
}
