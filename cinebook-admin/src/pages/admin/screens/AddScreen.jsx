import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { ArrowLeft, Crown, Eraser, Info, Sparkles, Armchair, Wand2, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import api, { errorMessage } from "../../../api/axios"
import SeatGrid, { SeatGridLegend } from "../../../components/SeatGrid"
import { PageHeader, Spinner } from "../../../components/ui"

const BRUSHES = [
  ["STANDARD", "Standard", Armchair, "bg-slate-200 text-slate-700"],
  ["PREMIUM", "Premium", Sparkles, "bg-violet-200 text-violet-800"],
  ["VIP", "VIP", Crown, "bg-amber-200 text-amber-800"],
  ["GAP", "Gap / aisle", Eraser, "bg-surface border border-dashed border-slate-300 text-slate-500"],
]
const FORMATS = ["2D", "3D", "IMAX", "4DX", "Dolby Atmos"]

function buildCells(rows, columns, prev) {
  const next = new Map()
  for (let r = 1; r <= rows; r++)
    for (let c = 1; c <= columns; c++) next.set(`${r}:${c}`, prev?.get(`${r}:${c}`) || { type: "STANDARD", active: true })
  return next
}

/** Create or edit a screen and paint its seat layout. */
export default function AddScreen() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const editing = !!id

  const [theaters, setTheaters] = useState([])
  const [form, setForm] = useState({ theaterId: params.get("theaterId") || "", screenName: "", format: "2D", rows: 8, columns: 12 })
  const [cells, setCells] = useState(() => buildCells(8, 12))
  const [brush, setBrush] = useState("PREMIUM")
  const [locked, setLocked] = useState(false) // has showtimes: size can't change
  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get("/theaters").then((res) => setTheaters(res.data)).catch(() => {})
    if (!editing) return
    api.get(`/screens/${id}`)
      .then(({ data }) => {
        setForm({ theaterId: String(data.theaterId), screenName: data.screenName, format: data.format || "2D", rows: data.rows, columns: data.columns })
        const map = new Map()
        data.seats.forEach((s) => map.set(`${s.row}:${s.col}`, { type: s.type, active: s.active }))
        setCells(buildCells(data.rows, data.columns, map))
        setLocked(data.hasShowtimes)
      })
      .catch((err) => {
        toast.error(errorMessage(err, "Screen not found"))
        navigate("/admin/screens")
      })
      .finally(() => setLoading(false))
  }, [editing, id, navigate])

  const resize = (key, value) => {
    const n = Math.max(1, Math.min(key === "rows" ? 26 : 40, Number(value) || 1))
    const next = { ...form, [key]: n }
    setForm(next)
    setCells((prev) => buildCells(next.rows, next.columns, prev))
  }

  const paint = (keys) =>
    setCells((prev) => {
      const next = new Map(prev)
      if (brush === "GAP") {
        // A single click toggles (so a gap can become a seat again); a whole row/column becomes gaps.
        const makeGap = keys.length > 1 || prev.get(keys[0]).active
        keys.forEach((k) => next.set(k, { ...prev.get(k), active: !makeGap }))
      } else {
        keys.forEach((k) => next.set(k, { type: brush, active: true }))
      }
      return next
    })

  const onCell = (r, c) => paint([`${r}:${c}`])
  const onRow = (r) => paint(Array.from({ length: form.columns }, (_, i) => `${r}:${i + 1}`))
  const onCol = (c) => paint(Array.from({ length: form.rows }, (_, i) => `${i + 1}:${c}`))

  const autoLayout = () => {
    const next = new Map()
    for (let r = 1; r <= form.rows; r++)
      for (let c = 1; c <= form.columns; c++) {
        const type = r > form.rows - 2 ? "VIP" : r > Math.floor(form.rows / 3) ? "PREMIUM" : "STANDARD"
        next.set(`${r}:${c}`, { type, active: true })
      }
    setCells(next)
  }

  const counts = useMemo(() => {
    const out = { STANDARD: 0, PREMIUM: 0, VIP: 0 }
    cells.forEach((v) => v.active && out[v.type]++)
    return out
  }, [cells])
  const totalSeats = counts.STANDARD + counts.PREMIUM + counts.VIP

  const save = async (e) => {
    e.preventDefault()
    if (!form.theaterId) return toast.error("Choose a theater")
    if (totalSeats === 0) return toast.error("The layout has no seats")
    setSaving(true)
    const seats = [...cells.entries()].map(([k, v]) => {
      const [row, col] = k.split(":").map(Number)
      return { row, col, type: v.type, active: v.active }
    })
    const body = { ...form, theaterId: Number(form.theaterId), seats }
    try {
      if (editing) await api.put(`/screens/${id}`, body)
      else await api.post("/screens", body)
      toast.success(editing ? "Layout saved" : `${form.screenName} created with ${totalSeats} seats`)
      navigate("/admin/screens")
    } catch (err) {
      toast.error(errorMessage(err, "Could not save screen"))
      setSaving(false)
    }
  }

  if (loading) return <div className="skeleton h-96" />

  return (
    <form onSubmit={save}>
      <Link to="/admin/screens" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft size={15} /> Screens</Link>
      <PageHeader
        title={editing ? `Edit ${form.screenName}` : "New screen"}
        subtitle="Set the grid size, then paint seat types. Click a row letter or column number to paint the whole line."
        actions={
          <button disabled={saving} className="btn-primary">{saving && <Spinner size={16} />}{editing ? "Save layout" : "Create screen"}</button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <div className="card space-y-4 p-5">
            <div>
              <label className="label" htmlFor="theater">Theater *</label>
              <select id="theater" className="input" required value={form.theaterId} disabled={locked}
                onChange={(e) => setForm({ ...form, theaterId: e.target.value })}>
                <option value="">Select theater</option>
                {theaters.map((t) => <option key={t.id} value={t.id}>{t.name} - {t.city}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="sname">Screen name *</label>
                <input id="sname" className="input" required value={form.screenName} placeholder="Screen 1"
                  onChange={(e) => setForm({ ...form, screenName: e.target.value })} />
              </div>
              <div>
                <label className="label" htmlFor="format">Format</label>
                <select id="format" className="input" value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}>
                  {FORMATS.map((f) => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="rows">Rows</label>
                <input id="rows" type="number" min="1" max="26" className="input" value={form.rows} disabled={locked} onChange={(e) => resize("rows", e.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor="cols">Seats per row</label>
                <input id="cols" type="number" min="1" max="40" className="input" value={form.columns} disabled={locked} onChange={(e) => resize("columns", e.target.value)} />
              </div>
            </div>
            {locked && (
              <p className="flex gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                <Info size={16} className="shrink-0" /> This screen has showtimes, so its size is fixed. You can still change seat types and gaps.
              </p>
            )}
          </div>

          <div className="card p-5">
            <p className="label">Brush</p>
            <div className="grid grid-cols-2 gap-2">
              {BRUSHES.map(([key, label, Icon, cls]) => (
                <button key={key} type="button" onClick={() => setBrush(key)}
                  className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-medium transition ${brush === key ? "border-brand" : "border-transparent"} ${cls}`}>
                  <Icon size={16} /> {label}
                </button>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" className="btn-secondary flex-1 px-2" onClick={autoLayout}><Wand2 size={15} /> Auto tiers</button>
              <button type="button" className="btn-secondary flex-1 px-2" onClick={() => setCells(buildCells(form.rows, form.columns))}><RotateCcw size={15} /> Reset</button>
            </div>
          </div>

          <div className="card grid grid-cols-4 divide-x divide-line text-center">
            {[["Total", totalSeats], ["Std", counts.STANDARD], ["Prem", counts.PREMIUM], ["VIP", counts.VIP]].map(([l, v]) => (
              <div key={l} className="py-3">
                <p className="font-display text-xl font-bold">{v}</p>
                <p className="text-xs text-muted">{l}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="font-semibold">Seat layout</p>
            <SeatGridLegend />
          </div>
          <SeatGrid rows={form.rows} columns={form.columns} cells={cells} interactive onCell={onCell} onRow={onRow} onCol={onCol} />
        </div>
      </div>
    </form>
  )
}
