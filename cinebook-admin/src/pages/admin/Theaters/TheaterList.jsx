import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import api from "../../../api/axios"

export default function TheaterList() {
  const [theaters, setTheaters] = useState([])

  const fetchTheaters = async () => {
    const res = await api.get("/theaters")
    setTheaters(res.data)
  }

  useEffect(() => {
    fetchTheaters()
  }, [])

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return

    await api.delete(`/theaters/${id}`)
    fetchTheaters()
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-[#CD2C58]">
          Manage Theaters
        </h1>
        <Link
          to="/admin/theaters/add"
          className="px-4 py-2 bg-[#8CE4FF] text-black rounded-lg shadow"
        >
          + Add Theater
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="py-3">Name</th>
              <th>City</th>
              <th>Total Screens</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {theaters.map((t) => (
              <tr key={t.id} className="border-b hover:bg-[#C2E2FA]">
                <td className="py-2">{t.name}</td>
                <td>{t.city}</td>
                <td>{t.totalScreens}</td>

                <td className="flex gap-2 py-2">
                  <Link
                    to={`/admin/theaters/edit/${t.id}`}
                    className="px-3 py-1 bg-[#8CE4FF] rounded"
                  >
                    Edit
                  </Link>

                  <button
                    onClick={() => handleDelete(t.id)}
                    className="px-3 py-1 bg-[#FF5656] text-white rounded"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
