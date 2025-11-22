import { useState } from "react"
import api from "../services/api.js"
import { useNavigate } from "react-router-dom"

export default function Register() {
  const navigate = useNavigate()
  const [data, setData] = useState({ fullName: "", email: "", password: "" })
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post("/auth/signup", {
        name: data.fullName,
        email: data.email,
        password: data.password,
      })
      navigate("/login")
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed")
    }
  }

  return (
    <div className="min-h-screen flex bg-blue-50 bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="flex-1 hidden lg:block">
        <img src="/register.png" alt="" />
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        <form
          className="w-full max-w-sm p-8 rounded-2xl shadow-xl"
          onSubmit={handleSubmit}
        >
          <h2 className="text-2xl font-bold text-red-600 mb-6">
            Create Account
          </h2>

          {error && <p className="text-red-500 mb-4 font-semibold">{error}</p>}

          <input
            type="text"
            placeholder="Full Name"
            className="border border-red-300 focus:border-red-500 focus:ring focus:ring-blue-200 p-2 mb-4 w-full rounded"
            onChange={(e) => setData({ ...data, fullName: e.target.value })}
          />

          <input
            type="email"
            placeholder="Email"
            className="border border-red-300 focus:border-red-500 focus:ring focus:ring-blue-200 p-2 mb-4 w-full rounded"
            onChange={(e) => setData({ ...data, email: e.target.value })}
          />

          <input
            type="password"
            placeholder="Password"
            className="border border-red-300 focus:border-red-500 focus:ring focus:ring-blue-200 p-2 mb-6 w-full rounded"
            onChange={(e) => setData({ ...data, password: e.target.value })}
          />

          <button className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600 transition-colors w-full cursor-pointer">
            Register
          </button>
        </form>
      </div>
    </div>
  )
}
