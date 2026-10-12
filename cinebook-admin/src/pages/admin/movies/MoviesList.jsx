import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { CalendarPlus, Film, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"
import api, { errorMessage } from "../../../api/axios"
import { ConfirmDialog, Empty, PageHeader, TableSkeleton } from "../../../components/ui"

export default function MoviesList() {
  const [movies, setMovies] = useState(null)
  const [query, setQuery] = useState("")
  const [toDelete, setToDelete] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = () =>
    api.get("/movies").then((res) => setMovies(res.data)).catch((err) => {
      toast.error(errorMessage(err))
      setMovies([])
    })

  useEffect(() => {
    load()
  }, [])

  const confirmDelete = async () => {
    setBusy(true)
    try {
      await api.delete(`/movies/${toDelete.id}`)
      toast.success(`"${toDelete.title}" deleted`)
      setToDelete(null)
      load()
    } catch (err) {
      toast.error(errorMessage(err, "Could not delete movie"))
    } finally {
      setBusy(false)
    }
  }

  const visible = (movies || []).filter((m) =>
    [m.title, m.genre, m.language].some((v) => v?.toLowerCase().includes(query.toLowerCase()))
  )

  return (
    <div>
      <PageHeader
        title="Movies"
        subtitle={movies ? `${movies.length} movies in the catalogue` : "Loading..."}
        actions={<Link to="/admin/movies/add" className="btn-primary"><Plus size={16} /> Add movie</Link>}
      />

      <div className="card overflow-hidden">
        <div className="border-b border-line p-4">
          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <input className="input pl-9" placeholder="Search title, genre, language" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>

        {!movies ? (
          <TableSkeleton />
        ) : visible.length === 0 ? (
          <Empty icon={Film} title="No movies" text="Add your first movie to start selling tickets."
            action={<Link to="/admin/movies/add" className="btn-primary"><Plus size={16} /> Add movie</Link>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-line bg-surface-2/60">
                <tr>
                  <th className="table-th">Movie</th>
                  <th className="table-th">Genre</th>
                  <th className="table-th">Runtime</th>
                  <th className="table-th">Upcoming shows</th>
                  <th className="table-th">Status</th>
                  <th className="table-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((m) => (
                  <tr key={m.id} className="hover:bg-surface-2/40">
                    <td className="table-td">
                      <div className="flex items-center gap-3">
                        {m.posterUrl ? (
                          <img src={m.posterUrl} alt="" className="h-14 w-10 shrink-0 rounded-md object-cover" />
                        ) : (
                          <div className="grid h-14 w-10 shrink-0 place-items-center rounded-md bg-surface-2 text-faint"><Film size={16} /></div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{m.title}</p>
                          <p className="text-xs text-muted">{[m.certificate, m.language].filter(Boolean).join(" · ")}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-td text-muted">{m.genre}</td>
                    <td className="table-td text-muted">{m.duration} min</td>
                    <td className="table-td">
                      <span className={m.upcomingShows ? "font-semibold" : "text-faint"}>{m.upcomingShows}</span>
                    </td>
                    <td className="table-td">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                        m.active ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20" : "bg-slate-100 text-slate-600 ring-slate-500/20"}`}>
                        {m.active ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="table-td">
                      <div className="flex justify-end gap-1">
                        <Link to={`/admin/showtimes/add?movieId=${m.id}`} className="btn-icon" title="Schedule showtimes"><CalendarPlus size={17} /></Link>
                        <Link to={`/admin/movies/edit/${m.id}`} className="btn-icon" title="Edit"><Pencil size={17} /></Link>
                        <button onClick={() => setToDelete(m)} className="btn-icon hover:text-red-600!" title="Delete"><Trash2 size={17} /></button>
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
        title="Delete movie?"
        message={`"${toDelete?.title}" and its showtimes without bookings will be deleted. Movies with bookings can't be deleted - mark them inactive instead.`}
        busy={busy}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  )
}
