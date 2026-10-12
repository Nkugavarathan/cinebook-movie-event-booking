import { useMemo, useState } from "react"
import { Search, SearchX } from "lucide-react"
import MovieCard from "./MovieCard"
import { EmptyState } from "./ui"
import { MovieCardSkeleton } from "./Skeletons"

/** Searchable, genre-filterable grid of movies. */
export default function MovieGrid({ movies, loading }) {
  const [query, setQuery] = useState("")
  const [genre, setGenre] = useState("All")
  const [language, setLanguage] = useState("All")

  const genres = useMemo(() => {
    const set = new Set()
    movies.forEach((m) => (m.genre || "").split(",").map((g) => g.trim()).filter(Boolean).forEach((g) => set.add(g)))
    return ["All", ...[...set].sort()]
  }, [movies])

  const languages = useMemo(() => ["All", ...new Set(movies.map((m) => m.language).filter(Boolean))], [movies])

  const visible = movies.filter((m) => {
    const q = query.trim().toLowerCase()
    const matchesQ = !q || [m.title, m.castMembers, m.director].some((v) => v?.toLowerCase().includes(q))
    const matchesG = genre === "All" || (m.genre || "").toLowerCase().includes(genre.toLowerCase())
    const matchesL = language === "All" || m.language === language
    return matchesQ && matchesG && matchesL
  })

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => setGenre(g)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                genre === g ? "border-brand bg-brand text-white" : "border-line bg-surface-2 text-muted hover:text-ink"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
        <div className="flex gap-2 lg:shrink-0">
          {languages.length > 2 && (
            <select value={language} onChange={(e) => setLanguage(e.target.value)} aria-label="Language"
              className="input w-40 shrink-0 py-2.5 text-sm">
              {languages.map((l) => <option key={l} value={l}>{l === "All" ? "All languages" : l}</option>)}
            </select>
          )}
          <div className="relative w-full lg:w-72">
            <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search movies, cast..." className="input py-2.5 pl-10 text-sm" />
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {loading
          ? Array.from({ length: 10 }).map((_, i) => <MovieCardSkeleton key={i} />)
          : visible.map((m) => <MovieCard key={m.id} movie={m} />)}
      </div>

      {!loading && visible.length === 0 && (
        <EmptyState icon={SearchX} title="No movies found" text="Try a different search or genre." />
      )}
    </div>
  )
}
