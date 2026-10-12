import { useState } from "react"
import { Link } from "react-router-dom"
import { Film } from "lucide-react"
import { Spinner } from "../../../components/ui"

export const EMPTY_MOVIE = {
  title: "",
  description: "",
  posterUrl: "",
  backdropUrl: "",
  trailerUrl: "",
  duration: "",
  genre: "",
  language: "English",
  certificate: "",
  director: "",
  castMembers: "",
  releaseDate: "",
  active: true,
}

const CERTS = ["", "G", "PG", "PG-13", "R", "NC-17", "U", "U/A", "A"]

export default function MovieForm({ movie, setMovie, onSubmit, saving, submitLabel = "Save movie" }) {
  const [posterBroken, setPosterBroken] = useState(false)
  const set = (k) => (e) => setMovie({ ...movie, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value })

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="card space-y-5 p-6">
        <div>
          <label className="label" htmlFor="title">Title *</label>
          <input id="title" className="input" required value={movie.title} onChange={set("title")} placeholder="e.g. Dune: Part Two" />
        </div>
        <div>
          <label className="label" htmlFor="description">Synopsis</label>
          <textarea id="description" rows={4} className="input" value={movie.description || ""} onChange={set("description")} />
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor="duration">Duration (min) *</label>
            <input id="duration" type="number" min="1" required className="input" value={movie.duration} onChange={set("duration")} />
          </div>
          <div>
            <label className="label" htmlFor="certificate">Certificate</label>
            <select id="certificate" className="input" value={movie.certificate || ""} onChange={set("certificate")}>
              {CERTS.map((c) => <option key={c} value={c}>{c || "—"}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="releaseDate">Release date</label>
            <input id="releaseDate" type="date" className="input" value={movie.releaseDate || ""} onChange={set("releaseDate")} />
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="genre">Genres</label>
            <input id="genre" className="input" value={movie.genre || ""} onChange={set("genre")} placeholder="Action, Sci-Fi" />
          </div>
          <div>
            <label className="label" htmlFor="language">Language</label>
            <input id="language" className="input" value={movie.language || ""} onChange={set("language")} />
          </div>
          <div>
            <label className="label" htmlFor="director">Director</label>
            <input id="director" className="input" value={movie.director || ""} onChange={set("director")} />
          </div>
          <div>
            <label className="label" htmlFor="castMembers">Cast</label>
            <input id="castMembers" className="input" value={movie.castMembers || ""} onChange={set("castMembers")} placeholder="Comma separated" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="posterUrl">Poster image URL</label>
          <input id="posterUrl" type="url" className="input" value={movie.posterUrl || ""}
            onChange={(e) => { setPosterBroken(false); set("posterUrl")(e) }} placeholder="https://..." />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="backdropUrl">Backdrop image URL</label>
            <input id="backdropUrl" type="url" className="input" value={movie.backdropUrl || ""} onChange={set("backdropUrl")} placeholder="Optional wide image" />
          </div>
          <div>
            <label className="label" htmlFor="trailerUrl">Trailer URL</label>
            <input id="trailerUrl" type="url" className="input" value={movie.trailerUrl || ""} onChange={set("trailerUrl")} placeholder="YouTube link" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="card overflow-hidden">
          <div className="aspect-2/3 bg-surface-2">
            {movie.posterUrl && !posterBroken ? (
              <img src={movie.posterUrl} alt="Poster preview" className="h-full w-full object-cover" onError={() => setPosterBroken(true)} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-faint">
                <Film size={36} />
                <span className="text-xs">{posterBroken ? "Image could not load" : "Poster preview"}</span>
              </div>
            )}
          </div>
        </div>
        <label className="card flex cursor-pointer items-start gap-3 p-4">
          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-brand" checked={!!movie.active} onChange={set("active")} />
          <span>
            <span className="block text-sm font-semibold">Active</span>
            <span className="text-xs text-muted">Visible and bookable on the client site.</span>
          </span>
        </label>
        <div className="flex gap-2">
          <Link to="/admin/movies" className="btn-secondary flex-1">Cancel</Link>
          <button disabled={saving} className="btn-primary flex-1">{saving && <Spinner size={16} />}{submitLabel}</button>
        </div>
      </div>
    </form>
  )
}
