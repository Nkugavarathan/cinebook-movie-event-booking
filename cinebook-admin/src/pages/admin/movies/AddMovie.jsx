import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import api, { errorMessage } from "../../../api/axios"
import MovieForm from "./MovieForm"
import { EMPTY_MOVIE } from "./movieDefaults"
import { PageHeader } from "../../../components/ui"

export default function AddMovie() {
  const navigate = useNavigate()
  const [movie, setMovie] = useState(EMPTY_MOVIE)
  const [saving, setSaving] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post("/movies", { ...movie, duration: Number(movie.duration), releaseDate: movie.releaseDate || null })
      toast.success(`"${movie.title}" added`)
      navigate("/admin/movies")
    } catch (err) {
      toast.error(errorMessage(err, "Could not save movie"))
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title="Add movie" subtitle="Add a film to the catalogue, then schedule showtimes for it." />
      <MovieForm movie={movie} setMovie={setMovie} onSubmit={onSubmit} saving={saving} submitLabel="Add movie" />
    </div>
  )
}
