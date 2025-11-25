import { useEffect, useState } from "react"
import api from "../../../api/axios"
import AdminSidebar from "../../../components/Sidebar"
import AdminHeader from "../../../components/Header"

export default function AddScreen() {
  const [theaters, setTheaters] = useState([])
  const [form, setForm] = useState({
    screenName: "",
    rows: "",
    columns: "",
    theaterId: "",
  })

  useEffect(() => {
    loadTheaters()
  }, [])

  const loadTheaters = async () => {
    const res = await api.get("/theaters")
    setTheaters(res.data)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    await api.post(`/screens/${form.theaterId}`, form)
    window.location.href = "/screens"
  }

  return (
    <div className="flex">
      <AdminSidebar />

      <div className="flex-1 bg-[#F7F7F7] min-h-screen">
        <AdminHeader />

        <div className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Add Screen</h2>

          <form
            onSubmit={onSubmit}
            className="bg-white p-6 shadow rounded w-full max-w-lg space-y-4"
          >
            <input
              type="text"
              placeholder="Screen Name"
              className="border p-2 w-full"
              value={form.screenName}
              onChange={(e) => setForm({ ...form, screenName: e.target.value })}
            />

            <input
              type="number"
              placeholder="Rows"
              className="border p-2 w-full"
              value={form.rows}
              onChange={(e) => setForm({ ...form, rows: e.target.value })}
            />

            <input
              type="number"
              placeholder="Columns"
              className="border p-2 w-full"
              value={form.columns}
              onChange={(e) => setForm({ ...form, columns: e.target.value })}
            />

            <select
              className="border p-2 w-full"
              value={form.theaterId}
              onChange={(e) => setForm({ ...form, theaterId: e.target.value })}
            >
              <option value="">Select Theater</option>
              {theaters.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            <button className="bg-[#8CE4FF] px-4 py-2 rounded text-black font-medium w-full">
              Add Screen
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
