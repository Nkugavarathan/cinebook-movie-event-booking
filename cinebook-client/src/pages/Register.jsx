import { useState } from "react"
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { useAuth } from "../context/AuthContext"
import { errorMessage } from "../services/api"
import AuthLayout from "../components/AuthLayout"
import { Spinner } from "../components/ui"

export default function Register() {
  const { register, isAuthed } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from || "/"
  const [data, setData] = useState({ name: "", email: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  if (isAuthed) return <Navigate to={from} replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    if (data.password.length < 6) return setError("Password must be at least 6 characters")
    setLoading(true)
    try {
      await register(data.name, data.email, data.password)
      toast.success("Account created — enjoy the show!")
      navigate(from, { replace: true })
    } catch (err) {
      setError(errorMessage(err, "Registration failed"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="It takes 20 seconds. Then grab your seats.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded-xl border border-brand/30 bg-brand-soft px-4 py-3 text-sm text-brand">{error}</p>}
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Full name</span>
          <input required autoComplete="name" className="input" placeholder="Jane Perera"
            value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Email</span>
          <input type="email" required autoComplete="email" className="input" placeholder="you@example.com"
            value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Password</span>
          <input type="password" required minLength={6} autoComplete="new-password" className="input" placeholder="At least 6 characters"
            value={data.password} onChange={(e) => setData({ ...data, password: e.target.value })} />
        </label>
        <button disabled={loading} className="btn-primary w-full">
          {loading && <Spinner size={18} />} Create account
        </button>
        <p className="text-center text-sm text-muted">
          Already have an account?{" "}
          <Link to="/login" state={location.state} className="font-semibold text-brand hover:underline">Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
