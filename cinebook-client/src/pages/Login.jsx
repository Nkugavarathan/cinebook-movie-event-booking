import { useState, useContext } from "react"
import { AuthContext } from "../context/AuthContext"
import api from "../services/api.js"
import { useNavigate, Link } from "react-router-dom"

export default function Login() {
  const { login } = useContext(AuthContext)
  const navigate = useNavigate()
  const [data, setData] = useState({ email: "", password: "" })
  const [error, setError] = useState("") // for red error text

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await api.post("/auth/login", data)
      login(res.data.token)
      navigate("/") // redirect
    } catch (err) {
      setError(err.response?.data?.message || "Login failed")
    }
  }

  return (
    <div className="flex min-h-screen bg-blue-50">
      <div className="flex-1 hidden lg:block">
        <img src="/login.png" alt="" />
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        <form
          className="w-full max-w-sm p-8 rounded-2xl shadow-xl"
          onSubmit={handleSubmit}
        >
          <h2 className="text-3xl font-bold text-red-600 mb-6">Login</h2>

          {error && <p className="text-red-500 mb-4 font-semibold">{error}</p>}

          <input
            type="email"
            placeholder="Email"
            className="border border-red-300 focus:border-red-500 focus:ring focus:ring-blue-200 p-2 mb-4 w-72 rounded"
            onChange={(e) => setData({ ...data, email: e.target.value })}
          />

          <input
            type="password"
            placeholder="Password"
            className="border border-red-300 focus:border-red-500 focus:ring focus:ring-blue-200 p-2 mb-4 w-72 rounded"
            onChange={(e) => setData({ ...data, password: e.target.value })}
          />

          <button className="bg-red-500 w-full text-white px-6 py-2 rounded hover:bg-red-600 cursor-pointer transition-colors">
            Login
          </button>

          <p className="text-sm text-gray-600 mt-3">
            Don’t have an account?{" "}
            <Link to="/register" className="text-blue-600 hover:underline">
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
