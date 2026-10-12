import { useEffect, useState } from "react"

// Each dialog is mounted only while open (see UsersList), so its state starts fresh every time.
import { Copy, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import api, { errorMessage } from "../../../api/axios"
import { Modal, Spinner, StatusBadge } from "../../../components/ui"
import { dateTime, money, shortDate, time12 } from "../../../lib/format"

/** Random readable password, e.g. "Kino-4827-Vexa". */
function generatePassword() {
  const words = ["Kino", "Reel", "Vexa", "Nova", "Luma", "Orbi", "Cine", "Pop", "Zeta", "Mira"]
  const pick = () => words[Math.floor(Math.random() * words.length)]
  return `${pick()}-${Math.floor(1000 + Math.random() * 9000)}-${pick()}`
}

function PasswordField({ value, onChange, id }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success("Password copied")
    } catch {
      toast.error("Copy failed - select and copy it manually")
    }
  }
  return (
    <div className="flex gap-2">
      <input id={id} className="input font-mono" required minLength={6} value={value} onChange={(e) => onChange(e.target.value)} />
      <button type="button" className="btn-icon shrink-0 border border-line" title="Generate" onClick={() => onChange(generatePassword())}><RefreshCw size={16} /></button>
      <button type="button" className="btn-icon shrink-0 border border-line" title="Copy" onClick={copy} disabled={!value}><Copy size={16} /></button>
    </div>
  )
}

export function AddUserDialog({ open, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({ name: "", email: "", password: generatePassword(), role: "USER" }))
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.post("/users", form)
      toast.success(`${res.data.role === "ADMIN" ? "Admin" : "User"} account created for ${res.data.email}`)
      onSaved()
    } catch (err) {
      toast.error(errorMessage(err, "Could not create user"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} title="Add user" onClose={onClose}
      footer={<>
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button form="add-user" className="btn-primary" disabled={saving}>{saving && <Spinner size={16} />} Create account</button>
      </>}>
      <form id="add-user" onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="u-name">Full name</label>
          <input id="u-name" className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="u-email">Email</label>
          <input id="u-email" type="email" className="input" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="u-pass">Temporary password</label>
          <PasswordField id="u-pass" value={form.password} onChange={(password) => setForm({ ...form, password })} />
          <p className="mt-1 text-xs text-muted">Share it with the person securely; they can sign in right away.</p>
        </div>
        <div>
          <p className="label">Role</p>
          <div className="grid grid-cols-2 gap-2">
            {[["USER", "Customer", "Books tickets on the client site"], ["ADMIN", "Admin", "Full access to this dashboard"]].map(([value, label, hint]) => (
              <label key={value} className={`cursor-pointer rounded-lg border p-3 transition ${form.role === value ? "border-brand bg-brand-soft" : "border-line hover:bg-surface-2"}`}>
                <input type="radio" name="role" className="sr-only" checked={form.role === value} onChange={() => setForm({ ...form, role: value })} />
                <span className="block text-sm font-semibold">{label}</span>
                <span className="text-xs text-muted">{hint}</span>
              </label>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  )
}

export function ResetPasswordDialog({ user, onClose }) {
  const [password, setPassword] = useState(generatePassword)
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.patch(`/users/${user.id}`, { password })
      toast.success(`Password reset for ${user.email}`)
      onClose()
    } catch (err) {
      toast.error(errorMessage(err, "Could not reset password"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={!!user} title="Reset password" onClose={onClose}
      footer={<>
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button form="reset-pass" className="btn-primary" disabled={saving}>{saving && <Spinner size={16} />} Set new password</button>
      </>}>
      <form id="reset-pass" onSubmit={submit} className="space-y-3">
        <p className="text-sm text-muted">Set a new password for <span className="font-semibold text-ink">{user?.name}</span> ({user?.email}). Copy it before saving and share it securely.</p>
        <PasswordField id="new-pass" value={password} onChange={setPassword} />
      </form>
    </Modal>
  )
}

/** User profile with stats and their recent bookings. */
export function UserDetailDialog({ userId, onClose }) {
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!userId) return
    api.get(`/users/${userId}`).then((res) => setData(res.data)).catch((err) => {
      toast.error(errorMessage(err))
      onClose()
    })
  }, [userId, onClose])

  const u = data?.user
  return (
    <Modal open={!!userId} wide title={u ? u.name : "User"} onClose={onClose}>
      {!data ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-12" />)}</div>
      ) : (
        <div>
          <div className="flex flex-wrap items-center gap-4">
            <Avatar name={u.name} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-semibold">{u.name}</p>
              <p className="truncate text-sm text-muted">{u.email}</p>
              <div className="mt-1.5 flex gap-2"><RoleBadge role={u.role} /><UserStatus blocked={u.blocked} /></div>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[["Bookings", u.bookings], ["Total spent", money(u.totalSpent, data.currency)], ["Joined", u.createdAt ? dateTime(u.createdAt) : "-"], ["Last booking", u.lastBookingAt ? dateTime(u.lastBookingAt) : "-"]].map(([l, v]) => (
              <div key={l} className="rounded-lg bg-surface-2 p-3">
                <p className="text-xs text-muted">{l}</p>
                <p className="mt-0.5 font-semibold">{v}</p>
              </div>
            ))}
          </div>
          <h3 className="mt-6 text-sm font-semibold">Bookings</h3>
          {data.bookings.length === 0 ? (
            <p className="mt-2 rounded-lg bg-surface-2 p-4 text-center text-sm text-muted">No bookings yet.</p>
          ) : (
            <div className="mt-2 overflow-x-auto rounded-lg border border-line">
              <table className="w-full">
                <thead className="bg-surface-2/60">
                  <tr><th className="table-th">Ref</th><th className="table-th">Show</th><th className="table-th">Seats</th><th className="table-th">Amount</th><th className="table-th">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.bookings.map((b) => (
                    <tr key={b.id}>
                      <td className="table-td font-mono text-xs font-semibold">{b.reference}</td>
                      <td className="table-td">
                        <p className="font-medium">{b.showtime.movieTitle}</p>
                        <p className="text-xs text-muted">{shortDate(b.showtime.showDate)} {time12(b.showtime.startTime)} · {b.showtime.theaterName}</p>
                      </td>
                      <td className="table-td text-muted">{b.seatLabels}</td>
                      <td className="table-td font-semibold tabular-nums">{money(b.totalAmount, b.currency)}</td>
                      <td className="table-td"><StatusBadge status={b.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

const AVATAR_COLORS = ["bg-rose-500", "bg-violet-500", "bg-sky-500", "bg-emerald-500", "bg-amber-500", "bg-indigo-500", "bg-pink-500", "bg-teal-500"]

export function Avatar({ name = "?", size = "md" }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "?"
  const color = AVATAR_COLORS[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % AVATAR_COLORS.length]
  const dim = size === "lg" ? "h-14 w-14 text-lg" : "h-9 w-9 text-xs"
  return <span className={`grid shrink-0 place-items-center rounded-full font-bold text-white ${dim} ${color}`}>{initials}</span>
}

export function RoleBadge({ role }) {
  return role === "ADMIN" ? (
    <span className="inline-flex rounded-full bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-700 ring-1 ring-inset ring-violet-600/20">Admin</span>
  ) : (
    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-500/20">Customer</span>
  )
}

export function UserStatus({ blocked }) {
  return blocked ? (
    <span className="inline-flex rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-600/20">Blocked</span>
  ) : (
    <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">Active</span>
  )
}
