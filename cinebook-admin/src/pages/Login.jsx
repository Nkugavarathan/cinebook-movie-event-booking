import { useState } from "react"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import { Lock } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { errorMessage } from "../api/axios"
import { Spinner } from "../components/ui"
import PasswordInput from "../components/PasswordInput"
import { homeFor } from "../ProtectedAdminRoute"

export default function Login() {
  const { token, user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from
  const [data, setData] = useState({ email: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  if (token && (user?.role === "ADMIN" || user?.role === "STAFF")) return <Navigate to={from || homeFor(user.role)} replace />

  const submit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const u = await login(data.email, data.password)
      navigate(u.role === "STAFF" ? homeFor("STAFF") : from || homeFor(u.role), { replace: true })
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
        <img src={`${import.meta.env.BASE_URL}logo-light.png`} alt="CineBook" className="h-10 w-auto dark:hidden" />
        <img src={`${import.meta.env.BASE_URL}logo-dark.png`} alt="CineBook" className="hidden h-10 w-auto dark:block" />
        <h1 className="mt-5 font-display text-2xl font-bold">Admin sign in</h1>
        <p className="mt-1 text-sm text-muted">Sign in with an admin or door-staff account.</p>

        {error && <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}

        <label className="mt-6 block">
          <span className="label">Email</span>
          <input type="email" required className="input" placeholder="admin@cinebook.com" autoComplete="username"
            value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} />
        </label>
        <label className="mt-4 block">
          <span className="label">Password</span>
          <PasswordInput required className="input" autoComplete="current-password"
            value={data.password} onChange={(e) => setData({ ...data, password: e.target.value })} />
        </label>
        <button disabled={loading} className="btn-primary mt-6 w-full py-3">
          {loading ? <Spinner size={16} /> : <Lock size={16} />} Sign in
        </button>
      </form>
    </div>
  )
}
