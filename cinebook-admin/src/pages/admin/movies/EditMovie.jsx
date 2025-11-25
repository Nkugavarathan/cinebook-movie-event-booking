import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import api from "../../../api/axios"
import MovieForm from "./MovieForm"
import AdminSidebar from "../../../components/Sidebar"
import AdminHeader from "../../../components/Header"

export default function EditMovie() {
  const { id } = useParams()
  const [movie, setMovie] = useState(null)

  const loadMovie = async () => {
    const res = await api.get(`/movies/${id}`)
    setMovie(res.data)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    await api.put(`/movies/${id}`, movie)
    window.location.href = "/movies"
  }

  useEffect(() => {
    loadMovie()
  }, [])

  if (!movie) return <p className="p-6">Loading...</p>

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 bg-[#F7F7F7] min-h-screen">
        <AdminHeader />
        <h2 className="p-6 text-2xl font-semibold">Edit Movie</h2>
        <MovieForm movie={movie} setMovie={setMovie} onSubmit={onSubmit} />
      </div>
    </div>
  )
}
