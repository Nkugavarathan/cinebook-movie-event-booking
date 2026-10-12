import { useEffect, useState } from "react"

// The dialog is mounted only while open (see UsersList), so its state starts fresh every time.
import { toast } from "sonner"
import api, { errorMessage } from "../../../api/axios"
import { Modal, StatusBadge } from "../../../components/ui"
import { dateTime, money, shortDate, time12 } from "../../../lib/format"

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
