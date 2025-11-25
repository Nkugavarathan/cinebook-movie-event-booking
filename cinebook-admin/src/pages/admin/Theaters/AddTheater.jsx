import { useState } from "react"
import api from "../../../api/axios"

import { useNavigate } from "react-router-dom"

export default function AddTheater() {
  const [form, setForm] = useState({
    name: "",
    city: "",
    totalScreens: "",
  })

  const nav = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    await api.post("/theaters", form)
    nav("/theaters")
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-semibold mb-6 text-[#CD2C58]">
        Add Theater
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg p-5 shadow space-y-4"
      >
        <input
          type="text"
          placeholder="Theater Name"
          className="w-full p-3 border rounded"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          type="text"
          placeholder="City"
          className="w-full p-3 border rounded"
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
        />

        <input
          type="number"
          placeholder="Total Screens"
          className="w-full p-3 border rounded"
          value={form.totalScreens}
          onChange={(e) => setForm({ ...form, totalScreens: e.target.value })}
        />

        <button
          className="w-full py-3 bg-[#8CE4FF] rounded text-black"
          type="submit"
        >
          Save Theater
        </button>
      </form>
    </div>
  )
}
