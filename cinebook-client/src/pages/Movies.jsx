import { useEffect, useState } from "react"
import { toast } from "sonner"
import api, { errorMessage } from "../services/api"
import MovieGrid from "../components/MovieGrid"

export default function Movies() {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get("/movies")
      .then((res) => setMovies(res.data))
      .catch((err) => toast.error(errorMessage(err, "Could not load movies")))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-4xl font-bold tracking-tight">Movies</h1>
      <p className="mt-1 text-muted">Everything playing at CineBook cinemas.</p>
      <div className="mt-8">
        <MovieGrid movies={movies} loading={loading} />
      </div>
    </div>
  )
}
