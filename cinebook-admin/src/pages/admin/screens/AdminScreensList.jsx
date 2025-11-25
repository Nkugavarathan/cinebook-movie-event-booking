import { useEffect, useState } from "react"
import api from "../../../api/axios"
import AdminSidebar from "../../../components/Sidebar"
import AdminHeader from "../../../components/Header"

export default function AdminScreensList() {
  const [screens, setScreens] = useState([])

  useEffect(() => {
    fetchScreens()
  }, [])

  const fetchScreens = async () => {
    const res = await api.get("/screens")
    setScreens(res.data)
  }

  const deleteScreen = async (id) => {
    await api.delete(`/screens/${id}`)
    fetchScreens()
  }

  return (
    <div className="flex">
      <AdminSidebar />

      <div className="flex-1 bg-[#F7F7F7] min-h-screen">
        <AdminHeader />

        <div className="p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Screens</h2>
            <a
              href="/admin/screens/add"
              className="bg-[#8CE4FF] px-4 py-2 rounded text-black font-medium"
            >
              Add Screen
            </a>
          </div>

          <table className="w-full mt-6 bg-white shadow rounded">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3">Screen Name</th>
                <th className="p-3">Rows</th>
                <th className="p-3">Columns</th>
                <th className="p-3">Theater</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {screens.map((s) => (
                <tr key={s.id} className="border-b">
                  <td className="p-2">{s.screenName}</td>
                  <td className="p-2">{s.rows}</td>
                  <td className="p-2">{s.columns}</td>
                  <td className="p-2">{s.theater?.name}</td>
                  <td className="p-2">
                    <button
                      onClick={() => deleteScreen(s.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded"
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
    </div>
  )
}
