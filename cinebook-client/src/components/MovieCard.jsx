import { Link } from "react-router-dom"
import { Clock } from "lucide-react"
import Poster from "./Poster"
import { RatingChip } from "./Stars"
import { runtime } from "../lib/format"

export default function MovieCard({ movie }) {
  return (
    <Link to={`/movies/${movie.id}`} className="group block">
      <div className="relative aspect-2/3 overflow-hidden rounded-2xl border border-line bg-surface shadow-xl shadow-black/30">
        <Poster src={movie.posterUrl} title={movie.title} className="h-full w-full transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/10 to-transparent opacity-80 transition group-hover:opacity-100" />
        <RatingChip avg={movie.avgRating} count={movie.reviewCount} className="absolute right-3 top-3" />
        {movie.certificate && (
          <span className="absolute left-3 top-3 rounded-md border border-white/40 bg-black/75 px-2 py-0.5 text-[11px] font-bold tracking-wide text-white shadow-md shadow-black/40 backdrop-blur-sm">
            {movie.certificate}
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 translate-y-2 p-4 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <span className="btn-primary w-full py-2.5 text-sm">
            {movie.upcomingShows > 0 ? "Book tickets" : "View details"}
          </span>
        </div>
      </div>
      <div className="mt-3 px-1">
        <h3 className="truncate font-display text-lg font-semibold group-hover:text-brand">{movie.title}</h3>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted">
          <span className="truncate">{movie.genre}</span>
          {movie.duration > 0 && (
            <>
              <span className="text-faint">•</span>
              <span className="flex shrink-0 items-center gap-1"><Clock size={12} />{runtime(movie.duration)}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  )
}
