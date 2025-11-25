import { useState } from "react"
import api from "../../../api/axios"
import MovieForm from "./MovieForm"
import AdminSidebar from "../../../components/Sidebar"
import AdminHeader from "../../../components/Header"

export default function AddMovie() {
  const [movie, setMovie] = useState({
    title: "",
    description: "",
    posterUrl: "",
    trailerUrl: "",
    genre: "",
    language: "",
    duration: "",
  })

  const onSubmit = async (e) => {
    e.preventDefault()
    await api.post("/movies", movie)
    window.location.href = "/admin/movies"
  }

  return (
    <div className="flex">
      <AdminSidebar />

      <div className="flex-1 bg-[#F7F7F7] min-h-screen">
        <AdminHeader />

        <h2 className="p-6 text-2xl font-semibold">Add Movie</h2>

        <MovieForm movie={movie} setMovie={setMovie} onSubmit={onSubmit} />
      </div>
    </div>
  )
}
