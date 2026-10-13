import { useCallback, useEffect, useState } from "react"
import { Ban, Eye, Search, ShieldCheck, Trash2, UserCheck, UserPlus, Users, UserX } from "lucide-react"
import { toast } from "sonner"
import api, { errorMessage } from "../../../api/axios"
import { ConfirmDialog, Empty, PageHeader, TableSkeleton } from "../../../components/ui"
import { dateTime, money } from "../../../lib/format"
import { Avatar, RoleBadge, UserDetailDialog, UserStatus } from "./UserDialogs"

const FILTERS = [
  ["all", "All", {}],
  ["USER", "Customers", { role: "USER" }],
  ["STAFF", "Staff", { role: "STAFF" }],
  ["ADMIN", "Admins", { role: "ADMIN" }],
  ["blocked", "Blocked", { blocked: true }],
]

export default function UsersList() {
  const [users, setUsers] = useState(null)
  const [stats, setStats] = useState(null)
  const [filter, setFilter] = useState("all")
  const [query, setQuery] = useState("")
  const [debounced, setDebounced] = useState("")
  const [viewing, setViewing] = useState(null)
  const [confirm, setConfirm] = useState(null) // { user, action }
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300)
    return () => clearTimeout(t)
  }, [query])

  const load = useCallback(() => {
    const params = { ...FILTERS.find(([k]) => k === filter)[2], ...(debounced && { q: debounced }) }
    api.get("/users", { params }).then((res) => setUsers(res.data)).catch((err) => {
      toast.error(errorMessage(err))
      setUsers([])
    })
    api.get("/users/summary").then((res) => setStats(res.data)).catch(() => {})
  }, [filter, debounced])

  useEffect(() => {
    load()
  }, [load])

  const closeViewing = useCallback(() => setViewing(null), [])

  const ACTIONS = {
    ADMIN: { title: "Make admin?", label: "Make admin", danger: false, body: { role: "ADMIN" },
      msg: (u) => `${u.name} will get full access to this admin dashboard.`, done: (u) => `${u.name} is now an admin` },
    STAFF: { title: "Make door staff?", label: "Make staff", danger: false, body: { role: "STAFF" },
      msg: (u) => `${u.name} will be able to sign in to the admin app and use only the ticket check-in scanner.`, done: (u) => `${u.name} is now door staff` },
    USER: { title: "Make customer?", label: "Make customer", danger: true, body: { role: "USER" },
      msg: (u) => `${u.name} will lose access to the admin app and become a regular customer.`, done: (u) => `${u.name} is now a customer` },
    block: { title: "Block this account?", label: "Block", danger: true, body: { blocked: true },
      msg: (u) => `${u.name} won't be able to sign in or book tickets. Existing bookings stay valid. You can unblock them any time.`, done: (u) => `${u.name} has been blocked` },
    unblock: { title: "Unblock this account?", label: "Unblock", danger: false, body: { blocked: false },
      msg: (u) => `${u.name} will be able to sign in and book again.`, done: (u) => `${u.name} has been unblocked` },
    delete: { title: "Delete this account?", label: "Delete", danger: true,
      msg: (u) => `${u.name} (${u.email}) will be permanently deleted. Accounts with bookings can't be deleted - block them instead.`, done: (u) => `${u.name} deleted` },
  }

  const runAction = async () => {
    const { user, action } = confirm
    const a = ACTIONS[action]
    setBusy(true)
    try {
      if (action === "delete") await api.delete(`/users/${user.id}`)
      else await api.patch(`/users/${user.id}`, a.body)
      toast.success(a.done(user))
      setConfirm(null)
      load()
    } catch (err) {
      toast.error(errorMessage(err, "Action failed"))
    } finally {
      setBusy(false)
    }
  }

  const cards = [
    ["Total users", stats?.total, Users, "text-sky-600 bg-sky-50"],
    ["Admins", stats?.admins, ShieldCheck, "text-violet-600 bg-violet-50"],
    ["Blocked", stats?.blocked, UserX, "text-red-600 bg-red-50"],
    ["New this week", stats?.newThisWeek, UserPlus, "text-emerald-600 bg-emerald-50"],
  ]

  const currency = stats?.currency || "usd"

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Customer accounts and their booking activity. Customers sign up and manage their own passwords."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, Icon, tone]) => (
          <div key={label} className="card flex items-center gap-4 p-5">
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone}`}><Icon size={20} /></span>
            <div>
              <p className="text-xs font-medium text-muted">{label}</p>
              <p className="mt-0.5 font-display text-2xl font-bold">{value ?? "-"}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-wrap gap-2 border-b border-line p-4">
          <div className="relative min-w-60 flex-1 sm:max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <input className="input pl-9" placeholder="Search name or email" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-1 rounded-lg bg-surface-2 p-1">
            {FILTERS.map(([key, label]) => (
              <button key={key} onClick={() => setFilter(key)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${filter === key ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {!users ? (
          <TableSkeleton />
        ) : users.length === 0 ? (
          <Empty icon={Users} title="No users found" text={query ? "Try a different search." : undefined} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-line bg-surface-2/60">
                <tr>
                  <th className="table-th">User</th>
                  <th className="table-th">Role</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Bookings</th>
                  <th className="table-th">Spent</th>
                  <th className="table-th">Joined</th>
                  <th className="table-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {users.map((u) => (
                  <tr key={u.id} className={`hover:bg-surface-2/40 ${u.blocked ? "opacity-70" : ""}`}>
                    <td className="table-td">
                      <button onClick={() => setViewing(u.id)} className="flex items-center gap-3 text-left">
                        <Avatar name={u.name} />
                        <span className="min-w-0">
                          <span className="flex items-center gap-2 font-semibold hover:text-brand">
                            <span className="truncate">{u.name}</span>
                            {u.self && <span className="rounded bg-brand-soft px-1.5 text-[10px] font-bold uppercase text-brand">You</span>}
                          </span>
                          <span className="block truncate text-xs text-muted">{u.email}</span>
                        </span>
                      </button>
                    </td>
                    <td className="table-td"><RoleBadge role={u.role} /></td>
                    <td className="table-td"><UserStatus blocked={u.blocked} /></td>
                    <td className="table-td tabular-nums">{u.bookings}</td>
                    <td className="table-td font-semibold tabular-nums">{money(u.totalSpent, currency)}</td>
                    <td className="table-td whitespace-nowrap text-muted">{u.createdAt ? dateTime(u.createdAt) : "-"}</td>
                    <td className="table-td">
                      <div className="flex justify-end gap-0.5">
                        <button className="btn-icon" title="View details" onClick={() => setViewing(u.id)}><Eye size={17} /></button>
                        {!u.self && (
                          <>
                            <select
                              aria-label={`Role for ${u.name}`}
                              title="Change role"
                              value={u.role}
                              onChange={(e) => setConfirm({ user: u, action: e.target.value })}
                              className="mr-1 rounded-md border border-line bg-surface px-1.5 py-1 text-xs font-medium text-muted hover:text-ink"
                            >
                              <option value="USER">Customer</option>
                              <option value="STAFF">Door staff</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                            {u.blocked ? (
                              <button className="btn-icon hover:text-emerald-600!" title="Unblock" onClick={() => setConfirm({ user: u, action: "unblock" })}><UserCheck size={17} /></button>
                            ) : (
                              <button className="btn-icon hover:text-red-600!" title="Block" onClick={() => setConfirm({ user: u, action: "block" })}><Ban size={17} /></button>
                            )}
                          </>
                        )}
                        {!u.self && (
                          <button className="btn-icon hover:text-red-600!" title="Delete" onClick={() => setConfirm({ user: u, action: "delete" })}><Trash2 size={17} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {viewing && <UserDetailDialog key={viewing} userId={viewing} onClose={closeViewing} />}
      <ConfirmDialog
        open={!!confirm}
        title={confirm ? ACTIONS[confirm.action].title : ""}
        message={confirm ? ACTIONS[confirm.action].msg(confirm.user) : ""}
        confirmLabel={confirm ? ACTIONS[confirm.action].label : ""}
        danger={confirm ? ACTIONS[confirm.action].danger : true}
        busy={busy}
        onConfirm={runAction}
        onClose={() => setConfirm(null)}
      />
    </div>
  )
}
