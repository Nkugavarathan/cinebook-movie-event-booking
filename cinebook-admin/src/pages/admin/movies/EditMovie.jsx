import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import api, { errorMessage } from "../../../api/axios"
import MovieForm, { EMPTY_MOVIE } from "./MovieForm"
import { PageHeader } from "../../../components/ui"

export default function EditMovie() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [movie, setMovie] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get(`/movies/${id}`)
      .then((res) => {
        const m = { ...EMPTY_MOVIE }
        Object.keys(EMPTY_MOVIE).forEach((k) => (m[k] = res.data[k] ?? EMPTY_MOVIE[k]))
        setMovie(m)
      })
      .catch((err) => {
        toast.error(errorMessage(err, "Movie not found"))
        navigate("/admin/movies")
      })
  }, [id, navigate])

  const onSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put(`/movies/${id}`, { ...movie, duration: Number(movie.duration), releaseDate: movie.releaseDate || null })
      toast.success("Movie updated")
      navigate("/admin/movies")
    } catch (err) {
      toast.error(errorMessage(err, "Could not save movie"))
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title="Edit movie" subtitle={movie?.title} />
      {movie ? <MovieForm movie={movie} setMovie={setMovie} onSubmit={onSubmit} saving={saving} /> : <div className="skeleton h-96" />}
    </div>
  )
}
