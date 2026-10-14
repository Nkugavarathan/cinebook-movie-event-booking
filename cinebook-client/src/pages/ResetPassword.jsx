import { useEffect, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import api, { errorMessage } from "../services/api"
import AuthLayout from "../components/AuthLayout"
import PasswordInput from "../components/PasswordInput"
import { Spinner } from "../components/ui"

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get("token") || ""
  const navigate = useNavigate()
  const [valid, setValid] = useState(token ? null : false) // null = checking
  const [data, setData] = useState({ password: "", confirm: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token) return
    api.get("/auth/reset-password/validate", { params: { token } })
      .then((res) => setValid(res.data.valid))
      .catch(() => setValid(false))
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    if (data.password.length < 6) return setError("Password must be at least 6 characters")
    if (data.password !== data.confirm) return setError("The two passwords don't match")
    setLoading(true)
    try {
      const res = await api.post("/auth/reset-password", { token, password: data.password })
      toast.success(res.data.message)
      navigate("/login", { replace: true })
    } catch (err) {
      setError(errorMessage(err, "Could not reset the password"))
      setLoading(false)
    }
  }

  if (valid === null) {
    return (
      <AuthLayout title="Reset password" subtitle="Checking your link...">
        <div className="flex justify-center py-6"><Spinner size={24} /></div>
      </AuthLayout>
    )
  }

  if (!valid) {
    return (
      <AuthLayout title="Link expired" subtitle="This reset link is invalid, has already been used, or has expired.">
        <div className="space-y-4">
          <p className="flex gap-3 rounded-xl border border-brand/30 bg-brand-soft px-4 py-3 text-sm text-brand">
            <AlertTriangle size={18} className="shrink-0" />
            For your security, reset links work once and only for a short time.
          </p>
          <Link to="/forgot-password" className="btn-primary w-full">Send a new link</Link>
          <p className="text-center text-sm text-muted">
            <Link to="/login" className="font-semibold text-brand hover:underline">Back to sign in</Link>
          </p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Choose a new password" subtitle="Use at least 6 characters. You'll sign in with it next.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded-xl border border-brand/30 bg-brand-soft px-4 py-3 text-sm text-brand">{error}</p>}
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">New password</span>
          <PasswordInput required minLength={6} autoFocus autoComplete="new-password" className="input" placeholder="••••••••"
            value={data.password} onChange={(e) => setData({ ...data, password: e.target.value })} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Confirm new password</span>
          <PasswordInput required minLength={6} autoComplete="new-password" className="input" placeholder="••••••••"
            value={data.confirm} onChange={(e) => setData({ ...data, confirm: e.target.value })} />
        </label>
        <button disabled={loading} className="btn-primary w-full">
          {loading && <Spinner size={18} />} Save new password
        </button>
      </form>
    </AuthLayout>
  )
}
