import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { ArrowLeft, Plus, X } from "lucide-react"
import { toast } from "sonner"
import api, { errorMessage } from "../../../api/axios"
import { PageHeader, Spinner } from "../../../components/ui"
import { time12, todayIso } from "../../../lib/format"

const QUICK_SLOTS = ["10:00", "13:30", "16:45", "19:30", "22:15"]

function addMinutes(hhmm, mins) {
  const [h, m] = hhmm.split(":").map(Number)
  const t = h * 60 + m + mins
  return `${String(Math.floor(t / 60) % 24).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`
}

export default function AddShowTime() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [movies, setMovies] = useState([])
  const [theaters, setTheaters] = useState([])
  const [screens, setScreens] = useState([])
  const [saving, setSaving] = useState(false)
  const [newTime, setNewTime] = useState("")

  const [form, setForm] = useState({
    movieId: params.get("movieId") || "",
    theaterId: "",
    screenId: "",
    showDate: todayIso(),
    startTimes: [],
    priceStandard: "",
    pricePremium: "",
    priceVip: "",
  })

  useEffect(() => {
    api.get("/movies").then((res) => setMovies(res.data.filter((m) => m.active))).catch(() => {})
    api.get("/theaters").then((res) => setTheaters(res.data)).catch(() => {})
  }, [])

  const chooseTheater = (theaterId) => {
    setForm((f) => ({ ...f, theaterId, screenId: "" }))
    setScreens([])
    if (theaterId) {
      api.get("/screens", { params: { theaterId } }).then((res) => setScreens(res.data)).catch(() => {})
    }
  }

  const movie = useMemo(() => movies.find((m) => String(m.id) === String(form.movieId)), [movies, form.movieId])
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const addTime = (t) => {
    if (!t || form.startTimes.includes(t)) return
    setForm({ ...form, startTimes: [...form.startTimes, t].sort() })
    setNewTime("")
  }
  const removeTime = (t) => setForm({ ...form, startTimes: form.startTimes.filter((x) => x !== t) })

  const submit = async (e) => {
    e.preventDefault()
    if (form.startTimes.length === 0) return toast.error("Add at least one start time")
    setSaving(true)
    try {
      const res = await api.post("/showtimes", {
        movieId: Number(form.movieId),
        screenId: Number(form.screenId),
        showDate: form.showDate,
        startTimes: form.startTimes,
        priceStandard: Number(form.priceStandard),
        pricePremium: form.pricePremium ? Number(form.pricePremium) : null,
        priceVip: form.priceVip ? Number(form.priceVip) : null,
      })
      toast.success(`${res.data.length} showtime${res.data.length > 1 ? "s" : ""} scheduled`)
      navigate("/admin/showtimes")
    } catch (err) {
      toast.error(errorMessage(err, "Could not create showtimes"))
      setSaving(false)
    }
  }

  const std = Number(form.priceStandard) || 0

  return (
    <form onSubmit={submit} className="max-w-3xl">
      <Link to="/admin/showtimes" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft size={15} /> Showtimes</Link>
      <PageHeader title="Schedule showtimes" subtitle="Add one or more start times for a movie on a screen. Overlapping shows are rejected automatically." />

      <div className="card space-y-6 p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="movie">Movie *</label>
            <select id="movie" className="input" required value={form.movieId} onChange={set("movieId")}>
              <option value="">Select movie</option>
              {movies.map((m) => <option key={m.id} value={m.id}>{m.title} ({m.duration} min)</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="theater">Theater *</label>
            <select id="theater" className="input" required value={form.theaterId}
              onChange={(e) => chooseTheater(e.target.value)}>
              <option value="">Select theater</option>
              {theaters.map((t) => <option key={t.id} value={t.id}>{t.name} - {t.city}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="screen">Screen *</label>
            <select id="screen" className="input" required value={form.screenId} onChange={set("screenId")} disabled={!form.theaterId}>
              <option value="">{form.theaterId && screens.length === 0 ? "No screens in this theater" : "Select screen"}</option>
              {screens.map((s) => <option key={s.id} value={s.id}>{s.screenName} · {s.format} · {s.activeSeats} seats</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="date">Date *</label>
            <input id="date" type="date" min={todayIso()} className="input" required value={form.showDate} onChange={set("showDate")} />
          </div>
        </div>

        <div>
          <p className="label">Start times *</p>
          <div className="flex flex-wrap gap-2">
            {form.startTimes.map((t) => (
              <span key={t} className="inline-flex items-center gap-2 rounded-lg bg-brand-soft py-1.5 pl-3 pr-1.5 text-sm font-semibold text-brand">
                {time12(t)}
                {movie && <span className="font-normal text-brand/70">→ {time12(addMinutes(t, movie.duration))}</span>}
                <button type="button" onClick={() => removeTime(t)} className="rounded p-0.5 hover:bg-brand/10" aria-label={`Remove ${t}`}><X size={14} /></button>
              </span>
            ))}
            {form.startTimes.length === 0 && <span className="text-sm text-faint">No times added yet.</span>}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input type="time" className="input w-36" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
            <button type="button" className="btn-secondary" onClick={() => addTime(newTime)} disabled={!newTime}><Plus size={15} /> Add</button>
            <span className="mx-1 text-xs text-faint">or quick add:</span>
            {QUICK_SLOTS.map((t) => (
              <button key={t} type="button" onClick={() => addTime(t)} disabled={form.startTimes.includes(t)}
                className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium hover:bg-surface-2 disabled:opacity-40">
                {time12(t)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="label">Ticket prices</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-muted" htmlFor="p-std">Standard *</label>
              <input id="p-std" type="number" min="0.5" step="0.01" required className="input" value={form.priceStandard} onChange={set("priceStandard")} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted" htmlFor="p-prem">Premium</label>
              <input id="p-prem" type="number" min="0.5" step="0.01" className="input" value={form.pricePremium} onChange={set("pricePremium")}
                placeholder={std ? `${(std * 1.5).toFixed(2)} (1.5×)` : "1.5× standard"} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted" htmlFor="p-vip">VIP</label>
              <input id="p-vip" type="number" min="0.5" step="0.01" className="input" value={form.priceVip} onChange={set("priceVip")}
                placeholder={std ? `${(std * 2).toFixed(2)} (2×)` : "2× standard"} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-line pt-5">
          <Link to="/admin/showtimes" className="btn-secondary">Cancel</Link>
          <button disabled={saving} className="btn-primary">
            {saving && <Spinner size={16} />} Schedule {form.startTimes.length > 1 ? `${form.startTimes.length} shows` : "show"}
          </button>
        </div>
      </div>
    </form>
  )
}
