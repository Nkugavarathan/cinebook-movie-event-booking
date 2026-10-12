import { useEffect, useMemo, useState } from "react"
import { PartyPopper, Search } from "lucide-react"
import { toast } from "sonner"
import api, { errorMessage } from "../services/api"
import EventCard from "../components/EventCard"
import { EmptyState } from "../components/ui"

export default function Events() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState("All")
  const [query, setQuery] = useState("")

  useEffect(() => {
    api.get("/events")
      .then((res) => setEvents(res.data))
      .catch((err) => toast.error(errorMessage(err, "Could not load events")))
      .finally(() => setLoading(false))
  }, [])

  const categories = useMemo(() => ["All", ...new Set(events.map((e) => e.category).filter(Boolean))], [events])
  const visible = events.filter((e) => {
    const q = query.trim().toLowerCase()
    return (category === "All" || e.category === category) &&
      (!q || [e.name, e.performer, e.venues].some((v) => v?.toLowerCase().includes(q)))
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-4xl font-bold tracking-tight">Events</h1>
      <p className="mt-1 text-muted">Concerts, comedy, theatre and more - pick your seats and go.</p>

      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                category === c ? "border-brand bg-brand text-white" : "border-line bg-surface-2 text-muted hover:text-ink"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="relative w-full lg:w-72">
          <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search events, artists..." className="input py-2.5 pl-10 text-sm" />
        </div>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-80" />)
          : visible.map((e) => <EventCard key={e.id} event={e} />)}
      </div>
      {!loading && visible.length === 0 && (
        <EmptyState icon={PartyPopper} title="No events found" text="Try another category or search." />
      )}
    </div>
  )
}
