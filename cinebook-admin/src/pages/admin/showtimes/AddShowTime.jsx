import { useEffect, useState } from "react"
import api from "../../../api/axios"
import AdminSidebar from "../../../components/Sidebar"
import AdminHeader from "../../../components/Header"

export default function AddShowTime() {
  const [movies, setMovies] = useState([])
  const [theaters, setTheaters] = useState([])
  const [screens, setScreens] = useState([])

  const [form, setForm] = useState({
    movieId: "",
    theaterId: "",
    screenId: "",
    showDate: "",
    startTimes: [],
    price: "",
  })

  useEffect(() => {
    fetchMovies()
    fetchTheaters()
  }, [])

  const fetchMovies = async () => {
    const res = await api.get("/movies")
    setMovies(res.data)
  }

  const fetchTheaters = async () => {
    const res = await api.get("/theaters")
    setTheaters(res.data)
  }

  const fetchScreens = async (theaterId) => {
    const res = await api.get(`/screens`)
    setScreens(res.data.filter((s) => s.theater.id == theaterId))
  }

  const onSubmit = async (e) => {
    e.preventDefault()

    await api.post(`/showtimes/${form.movieId}/${form.screenId}`, form)
    window.location.href = "/showtimes"
  }

  return (
    <div className="flex">
      <AdminSidebar />

      <div className="flex-1 bg-[#F7F7F7] min-h-screen">
        <AdminHeader />

        <div className="p-6 w-full max-w-xl mx-auto">
          <h2 className="text-2xl font-semibold mb-4">Add ShowTime</h2>

          <form
            onSubmit={onSubmit}
            className="space-y-4 bg-white p-6 shadow rounded"
          >
            {/* MOVIE */}
            <select
              className="p-2 border w-full"
              value={form.movieId}
              onChange={(e) => setForm({ ...form, movieId: e.target.value })}
            >
              <option value="">Select Movie</option>
              {movies.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>

            {/* THEATER */}
            <select
              className="p-2 border w-full"
              value={form.theaterId}
              onChange={(e) => {
                setForm({ ...form, theaterId: e.target.value })
                fetchScreens(e.target.value)
              }}
            >
              <option value="">Select Theater</option>
              {theaters.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            {/* SCREEN */}
            <select
              className="p-2 border w-full"
              value={form.screenId}
              onChange={(e) => setForm({ ...form, screenId: e.target.value })}
            >
              <option value="">Select Screen</option>
              {screens.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.screenName}
                </option>
              ))}
            </select>

            {/* DATE */}
            <input
              type="date"
              className="p-2 border w-full"
              value={form.startTimes}
              onChange={(e) => {
                const selected = Array.from(
                  e.target.selectedOptions,
                  (option) => option.value
                )
                setForm({ ...form, startTimes: selected })
              }}
            />

            {/* TIME */}
            <select
              className="p-2 border w-full"
              value={form.startTimes}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            >
              <option value="">Select Time Slot</option>
              <option value="10:30">10:30 AM</option>
              <option value="14:30">02:30 PM</option>
              <option value="18:30">06:30 PM</option>
              <option value="22:30">10:30 PM</option>
            </select>

            {/* PRICE */}
            <input
              type="number"
              placeholder="Ticket Price"
              className="p-2 border w-full"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />

            <button className="bg-[#8CE4FF] px-4 py-2 rounded w-full font-semibold">
              Add ShowTime
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
