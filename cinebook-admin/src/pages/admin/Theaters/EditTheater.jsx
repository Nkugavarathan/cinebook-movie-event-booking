import { useEffect, useState } from "react"
import api from "../../../api/axios"

import { useNavigate, useParams } from "react-router-dom"

export default function EditTheater() {
  const { id } = useParams()
  const [form, setForm] = useState({})
  const nav = useNavigate()

  const fetchData = async () => {
    const res = await api.get(`/theaters/${id}`)
    setForm(res.data)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    await api.put(`/theaters/${id}`, form)
    nav("/theaters")
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-semibold mb-6 text-[#CD2C58]">
        Edit Theater
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg p-5 shadow space-y-4"
      >
        <input
          type="text"
          placeholder="Theater Name"
          className="w-full p-3 border rounded"
          value={form.name || ""}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          type="text"
          placeholder="City"
          className="w-full p-3 border rounded"
          value={form.city || ""}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
        />

        <input
          type="number"
          placeholder="Total Screens"
          className="w-full p-3 border rounded"
          value={form.totalScreens || ""}
          onChange={(e) => setForm({ ...form, totalScreens: e.target.value })}
        />

        <button
          className="w-full py-3 bg-[#8CE4FF] rounded text-black"
          type="submit"
        >
          Update Theater
        </button>
      </form>
    </div>
  )
}
