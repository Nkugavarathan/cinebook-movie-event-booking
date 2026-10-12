import { useState } from "react"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import { Clapperboard, Lock } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { errorMessage } from "../api/axios"
import { Spinner } from "../components/ui"

export default function Login() {
  const { token, user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || "/admin/dashboard"
  const [data, setData] = useState({ email: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  if (token && user?.role === "ADMIN") return <Navigate to={from} replace />

  const submit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await login(data.email, data.password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(errorMessage(err, "Login failed"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-side px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(225,29,72,.25),transparent_60%)]" />
      <form onSubmit={submit} className="relative w-full max-w-sm rounded-2xl bg-surface p-8 shadow-2xl">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-linear-to-br from-brand to-amber-500 text-white">
          <Clapperboard size={22} />
        </span>
        <h1 className="mt-5 font-display text-2xl font-bold">CineBook Admin</h1>
        <p className="mt-1 text-sm text-muted">Sign in with an administrator account.</p>

        {error && <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}

        <label className="mt-6 block">
          <span className="label">Email</span>
          <input type="email" required className="input" placeholder="admin@cinebook.com" autoComplete="username"
            value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} />
        </label>
        <label className="mt-4 block">
          <span className="label">Password</span>
          <input type="password" required className="input" autoComplete="current-password"
            value={data.password} onChange={(e) => setData({ ...data, password: e.target.value })} />
        </label>
        <button disabled={loading} className="btn-primary mt-6 w-full py-3">
          {loading ? <Spinner size={16} /> : <Lock size={16} />} Sign in
        </button>
      </form>
    </div>
  )
}
