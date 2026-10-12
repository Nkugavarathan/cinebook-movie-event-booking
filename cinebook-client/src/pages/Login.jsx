import { useState } from "react"
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useAuth } from "../context/AuthContext"
import { errorMessage } from "../services/api"
import AuthLayout from "../components/AuthLayout"
import PasswordInput from "../components/PasswordInput"
import { Spinner } from "../components/ui"

export default function Login() {
  const { login, isAuthed } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || "/"
  const [data, setData] = useState({ email: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  if (isAuthed) return <Navigate to={from} replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const user = await login(data.email, data.password)
      toast.success(`Welcome back, ${user.name}!`)
      navigate(from, { replace: true })
    } catch (err) {
      setError(errorMessage(err, "Login failed"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to book seats and see your tickets.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded-xl border border-brand/30 bg-brand-soft px-4 py-3 text-sm text-brand">{error}</p>}
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Email</span>
          <input type="email" required autoComplete="email" className="input" placeholder="you@example.com"
            value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Password</span>
          <PasswordInput required autoComplete="current-password" className="input" placeholder="••••••••"
            value={data.password} onChange={(e) => setData({ ...data, password: e.target.value })} />
        </label>
        <button disabled={loading} className="btn-primary w-full">
          {loading && <Spinner size={18} />} Sign in
        </button>
        <p className="text-center text-sm text-muted">
          New to CineBook?{" "}
          <Link to="/register" state={location.state} className="font-semibold text-brand hover:underline">Create an account</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
