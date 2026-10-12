import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, MapPin, MonitorPlay, Pencil, Plus } from "lucide-react"
import { toast } from "sonner"
import api, { errorMessage } from "../../../api/axios"
import { Empty, PageHeader } from "../../../components/ui"
import TheaterFormModal from "./AddTheater"

/** Theater detail: its info plus the screens it contains. */
export default function EditTheater() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [theater, setTheater] = useState(null)
  const [screens, setScreens] = useState([])
  const [editing, setEditing] = useState(false)

  const load = useCallback(() => {
    Promise.all([api.get(`/theaters/${id}`), api.get(`/screens`, { params: { theaterId: id } })])
      .then(([t, s]) => {
        setTheater(t.data)
        setScreens(s.data)
      })
      .catch((err) => {
        toast.error(errorMessage(err, "Theater not found"))
        navigate("/admin/theaters")
      })
  }, [id, navigate])

  useEffect(() => {
    load()
  }, [load])

  if (!theater) return <div className="skeleton h-64" />

  return (
    <div>
      <Link to="/admin/theaters" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft size={15} /> Theaters</Link>
      <PageHeader
        title={theater.name}
        subtitle={<span className="flex items-center gap-1"><MapPin size={14} />{[theater.address, theater.city].filter(Boolean).join(", ")}</span>}
        actions={
          <>
            <button className="btn-secondary" onClick={() => setEditing(true)}><Pencil size={16} /> Edit details</button>
            <Link to={`/admin/screens/add?theaterId=${theater.id}`} className="btn-primary"><Plus size={16} /> Add screen</Link>
          </>
        }
      />

      <div className="card">
        {screens.length === 0 ? (
          <Empty icon={MonitorPlay} title="No screens" text="Design a screen's seat layout to start scheduling shows here."
            action={<Link to={`/admin/screens/add?theaterId=${theater.id}`} className="btn-primary"><Plus size={16} /> Add screen</Link>} />
        ) : (
          <div className="divide-y divide-line">
            {screens.map((s) => (
              <Link key={s.id} to={`/admin/screens/edit/${s.id}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-surface-2/50">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-surface-2 text-muted"><MonitorPlay size={18} /></span>
                  <div>
                    <p className="font-semibold">{s.screenName} {s.format && <span className="ml-1 rounded bg-surface-2 px-1.5 py-0.5 text-xs font-semibold text-muted">{s.format}</span>}</p>
                    <p className="text-xs text-muted">{s.rows} rows × {s.columns} columns · {s.activeSeats} seats</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-brand">Edit layout</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <TheaterFormModal
        open={editing}
        theater={theater}
        onClose={() => setEditing(false)}
        onSaved={() => {
          setEditing(false)
          load()
        }}
      />
    </div>
  )
}
