import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import api from "../../../api/axios"
import AdminSidebar from "../../../components/Sidebar"
import AdminHeader from "../../../components/Header"

export default function MoviesList() {
  const [movies, setMovies] = useState([])

  const loadMovies = async () => {
    const res = await api.get("/admin/movies")
    setMovies(res.data)
  }

  const deleteMovie = async (id) => {
    if (!window.confirm("Delete this movie?")) return

    await api.delete(`/admin/movies/${id}`)
    loadMovies()
  }

  useEffect(() => {
    loadMovies()
  }, [])

  return (
    <div className="flex">
      <AdminSidebar />

      <div className="flex-1 bg-[#F7F7F7] min-h-screen">
        <AdminHeader />

        <div className="flex justify-between p-6">
          <h2 className="text-2xl font-semibold">Movies</h2>

          <Link
            to="/admin/movies/add"
            className="px-4 py-2 bg-[#8CE4FF] rounded shadow"
          >
            + Add Movie
          </Link>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {movies.map((m) => (
            <div key={m.id} className="bg-[#ECD5BC] p-4 rounded-xl shadow">
              <img
                src={m.posterUrl}
                alt={m.title}
                className="w-full h-48 object-cover rounded-lg"
              />
              <h3 className="text-xl font-bold mt-3">{m.title}</h3>
              <p className="text-gray-700 text-sm mt-1">{m.genre}</p>

              <div className="flex gap-3 mt-4">
                <Link
                  to={`/admin/movies/edit/${m.id}`}
                  className="px-4 py-1 bg-[#C2E2FA] rounded"
                >
                  Edit
                </Link>

                <button
                  onClick={() => deleteMovie(m.id)}
                  className="px-4 py-1 bg-[#FF5656] text-white rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
