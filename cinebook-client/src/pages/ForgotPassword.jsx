import { useState } from "react"
import { Link } from "react-router-dom"
import { MailCheck } from "lucide-react"
import api, { errorMessage } from "../services/api"
import AuthLayout from "../components/AuthLayout"
import { Spinner } from "../components/ui"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await api.post("/auth/forgot-password", { email: email.trim() })
      setSent(true)
    } catch (err) {
      setError(errorMessage(err, "Could not send the reset link"))
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <AuthLayout title="Check your email" subtitle="If an account exists for that email, a reset link is on its way.">
        <div className="space-y-4">
          <div className="flex gap-3 rounded-xl border border-line bg-surface p-4 text-sm text-muted">
            <MailCheck size={20} className="shrink-0 text-brand" />
            <p>
              We sent it to <span className="font-semibold text-ink">{email.trim()}</span>. The link works once and expires in 30 minutes.
              Can't see it? Check your spam folder.
            </p>
          </div>
          <button onClick={() => setSent(false)} className="btn-ghost w-full">Use a different email</button>
          <p className="text-center text-sm text-muted">
            <Link to="/login" className="font-semibold text-brand hover:underline">Back to sign in</Link>
          </p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Forgot password?" subtitle="Enter your email and we'll send you a link to choose a new password.">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded-xl border border-brand/30 bg-brand-soft px-4 py-3 text-sm text-brand">{error}</p>}
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Email</span>
          <input type="email" required autoFocus autoComplete="email" className="input" placeholder="you@example.com"
            value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <button disabled={loading} className="btn-primary w-full">
          {loading && <Spinner size={18} />} Send reset link
        </button>
        <p className="text-center text-sm text-muted">
          Remembered it?{" "}
          <Link to="/login" className="font-semibold text-brand hover:underline">Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
