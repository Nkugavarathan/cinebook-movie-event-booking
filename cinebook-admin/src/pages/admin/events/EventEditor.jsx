import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, PartyPopper } from "lucide-react"
import { toast } from "sonner"
import api, { errorMessage } from "../../../api/axios"
import { PageHeader, Spinner } from "../../../components/ui"
import { EMPTY_EVENT, EVENT_CATEGORIES } from "./eventDefaults"

/** Create (/admin/events/add) or edit (/admin/events/edit/:id) an event. */
export default function EventEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const editing = !!id
  const [form, setForm] = useState(editing ? null : EMPTY_EVENT)
  const [saving, setSaving] = useState(false)
  const [imgBroken, setImgBroken] = useState(false)

  useEffect(() => {
    if (!editing) return
    api.get(`/events/${id}`)
      .then(({ data }) => {
        const f = { ...EMPTY_EVENT }
        Object.keys(EMPTY_EVENT).forEach((k) => (f[k] = data[k] ?? EMPTY_EVENT[k]))
        setForm(f)
      })
      .catch((err) => {
        toast.error(errorMessage(err, "Event not found"))
        navigate("/admin/events")
      })
  }, [editing, id, navigate])

  if (!form) return <div className="skeleton h-96" />

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const body = { ...form, duration: Number(form.duration) }
      if (editing) await api.put(`/events/${id}`, body)
      else await api.post("/events", body)
      toast.success(editing ? "Event updated" : `"${form.name}" created - now schedule its dates`)
      navigate("/admin/events")
    } catch (err) {
      toast.error(errorMessage(err, "Could not save event"))
      setSaving(false)
    }
  }

  const preview = form.bannerUrl || form.posterUrl

  return (
    <form onSubmit={submit}>
      <Link to="/admin/events" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft size={15} /> Events</Link>
      <PageHeader
        title={editing ? "Edit event" : "New event"}
        subtitle="Events are performed in a venue hall, so customers pick seats just like movies. Schedule dates under Showtimes."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="card space-y-5 p-6">
          <div>
            <label className="label" htmlFor="name">Event name *</label>
            <input id="name" className="input" required value={form.name} onChange={set("name")} placeholder="e.g. Symphony Under the Stars" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="category">Category *</label>
              <select id="category" className="input" value={form.category} onChange={set("category")}>
                {EVENT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="performer">Artist / performer</label>
              <input id="performer" className="input" value={form.performer || ""} onChange={set("performer")} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="description">Description</label>
            <textarea id="description" rows={5} className="input" value={form.description || ""} onChange={set("description")} />
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="duration">Duration (min) *</label>
              <input id="duration" type="number" min="1" required className="input" value={form.duration} onChange={set("duration")} />
            </div>
            <div>
              <label className="label" htmlFor="age">Age limit</label>
              <input id="age" className="input" value={form.ageLimit || ""} onChange={set("ageLimit")} placeholder="All ages / 18+" />
            </div>
            <div>
              <label className="label" htmlFor="lang">Language</label>
              <input id="lang" className="input" value={form.language || ""} onChange={set("language")} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="poster">Poster image URL</label>
            <input id="poster" type="url" className="input" value={form.posterUrl || ""} placeholder="https://..."
              onChange={(e) => { setImgBroken(false); set("posterUrl")(e) }} />
          </div>
          <div>
            <label className="label" htmlFor="banner">Banner image URL (wide, optional)</label>
            <input id="banner" type="url" className="input" value={form.bannerUrl || ""} placeholder="https://..."
              onChange={(e) => { setImgBroken(false); set("bannerUrl")(e) }} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="card overflow-hidden">
            <div className="aspect-4/3 bg-surface-2">
              {preview && !imgBroken ? (
                <img src={preview} alt="Preview" className="h-full w-full object-cover" onError={() => setImgBroken(true)} />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-faint">
                  <PartyPopper size={34} />
                  <span className="text-xs">{imgBroken ? "Image could not load" : "Image preview"}</span>
                </div>
              )}
            </div>
          </div>
          <label className="card flex cursor-pointer items-start gap-3 p-4">
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-brand" checked={!!form.active} onChange={set("active")} />
            <span>
              <span className="block text-sm font-semibold">Active</span>
              <span className="text-xs text-muted">Visible and bookable on the client site.</span>
            </span>
          </label>
          <div className="flex gap-2">
            <Link to="/admin/events" className="btn-secondary flex-1">Cancel</Link>
            <button disabled={saving} className="btn-primary flex-1">{saving && <Spinner size={16} />}{editing ? "Save" : "Create event"}</button>
          </div>
        </div>
      </div>
    </form>
  )
}
