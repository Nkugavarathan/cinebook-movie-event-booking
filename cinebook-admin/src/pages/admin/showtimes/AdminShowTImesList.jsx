import { useEffect, useState } from "react"
import api from "../../../api/axios"
import AdminSidebar from "../../../components/Sidebar"
import AdminHeader from "../../../components/Header"

export default function AdminShowTimesList() {
  const [showTimes, setShowTimes] = useState([])

  useEffect(() => {
    fetchShowTimes()
  }, [])

  const fetchShowTimes = async () => {
    const res = await api.get("/showtimes")
    setShowTimes(res.data)
  }

  const deleteShowTime = async (id) => {
    await api.delete(`/showtimes/${id}`)
    fetchShowTimes()
  }

  return (
    <div className="flex">
      <AdminSidebar />

      <div className="flex-1 bg-[#F7F7F7] min-h-screen">
        <AdminHeader />

        <div className="p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">ShowTimes</h2>

            <a
              href="/showtimes/add"
              className="bg-[#8CE4FF] px-4 py-2 rounded text-black font-medium"
            >
              Add ShowTime
            </a>
          </div>

          <table className="w-full mt-6 bg-white shadow rounded">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3">Movie</th>
                <th className="p-3">Screen</th>
                <th className="p-3">Theater</th>
                <th className="p-3">Date</th>
                <th className="p-3">Time</th>
                <th className="p-3">Price</th>
                <th className="p-3"></th>
              </tr>
            </thead>

            <tbody>
              {showTimes.map((st) => (
                <tr key={st.id} className="border-b">
                  <td className="p-2">{st.movie?.title}</td>
                  <td className="p-2">{st.screen?.screenName}</td>
                  <td className="p-2">{st.screen?.theater?.name}</td>
                  <td className="p-2">{st.showDate}</td>
                  <td className="p-2">{st.startTime}</td>
                  <td className="p-2">{st.price}</td>

                  <td className="p-2">
                    <button
                      onClick={() => deleteShowTime(st.id)}
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
