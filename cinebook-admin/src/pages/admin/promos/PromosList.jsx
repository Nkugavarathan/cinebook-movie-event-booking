import { useEffect, useState } from "react"
import { BadgePercent, Copy, Pencil, Plus, Power, Tag, Trash2, TrendingDown } from "lucide-react"
import { toast } from "sonner"
import api, { errorMessage } from "../../../api/axios"
import { ConfirmDialog, Empty, PageHeader, TableSkeleton } from "../../../components/ui"
import { dateTime, money } from "../../../lib/format"
import PromoForm from "./PromoForm"

const STATUS = {
  ACTIVE: ["Active", "bg-emerald-50 text-emerald-700 ring-emerald-600/20"],
  SCHEDULED: ["Scheduled", "bg-sky-50 text-sky-700 ring-sky-600/20"],
  EXPIRED: ["Expired", "bg-slate-100 text-slate-600 ring-slate-500/20"],
  USED_UP: ["Used up", "bg-amber-50 text-amber-700 ring-amber-600/20"],
  DISABLED: ["Off", "bg-slate-100 text-slate-600 ring-slate-500/20"],
}

function describe(p) {
  const off = p.discountType === "PERCENT"
    ? `${Number(p.discountValue)}% off${p.maxDiscount ? `, max ${money(p.maxDiscount, p.currency)}` : ""}`
    : `${money(p.discountValue, p.currency)} off`
  return p.minOrderAmount ? `${off} · min ${money(p.minOrderAmount, p.currency)}` : off
}

export default function PromosList() {
  const [promos, setPromos] = useState(null)
  const [editing, setEditing] = useState(undefined) // undefined closed, null new, object edit
  const [toDelete, setToDelete] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = () =>
    api.get("/promos").then((res) => setPromos(res.data)).catch((err) => {
      toast.error(errorMessage(err))
      setPromos([])
    })

  useEffect(() => {
    load()
  }, [])

  const toggle = async (p) => {
    try {
      await api.put(`/promos/${p.id}`, { ...p, active: !p.active })
      toast.success(`${p.code} turned ${p.active ? "off" : "on"}`)
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await api.delete(`/promos/${toDelete.id}`)
      toast.success(`${toDelete.code} deleted`)
      setToDelete(null)
      load()
    } catch (err) {
      toast.error(errorMessage(err, "Could not delete"))
    } finally {
      setBusy(false)
    }
  }

  const copy = async (code) => {
    try {
      await navigator.clipboard.writeText(code)
      toast.success(`${code} copied`)
    } catch {
      /* clipboard blocked */
    }
  }

  const currency = promos?.[0]?.currency || "lkr"
  const active = (promos || []).filter((p) => p.status === "ACTIVE").length
  const uses = (promos || []).reduce((n, p) => n + p.timesUsed, 0)
  const given = (promos || []).reduce((n, p) => n + Number(p.totalDiscountGiven), 0)

  return (
    <div>
      <PageHeader
        title="Promo codes"
        subtitle="Discount codes customers enter at checkout. Discounts are applied by the server and shown on Stripe."
        actions={<button onClick={() => setEditing(null)} className="btn-primary"><Plus size={16} /> New code</button>}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[["Active codes", active, Tag, "text-emerald-600 bg-emerald-50"],
          ["Times used (paid)", uses, BadgePercent, "text-violet-600 bg-violet-50"],
          ["Discount given", money(given, currency), TrendingDown, "text-brand bg-brand-soft"]].map(([label, value, Icon, tone]) => (
          <div key={label} className="card flex items-center gap-4 p-5">
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone}`}><Icon size={20} /></span>
            <div>
              <p className="text-xs font-medium text-muted">{label}</p>
              <p className="mt-0.5 font-display text-2xl font-bold">{promos ? value : "-"}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        {!promos ? (
          <TableSkeleton />
        ) : promos.length === 0 ? (
          <Empty icon={BadgePercent} title="No promo codes yet" text="Create a code like FIRSTSHOW20 and share it with customers."
            action={<button onClick={() => setEditing(null)} className="btn-primary"><Plus size={16} /> New code</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-line bg-surface-2/60">
                <tr>
                  <th className="table-th">Code</th>
                  <th className="table-th">Discount</th>
                  <th className="table-th">Used</th>
                  <th className="table-th">Saved customers</th>
                  <th className="table-th">Valid</th>
                  <th className="table-th">Status</th>
                  <th className="table-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {promos.map((p) => {
                  const [label, cls] = STATUS[p.status] || STATUS.DISABLED
                  const pct = p.usageLimit ? Math.min(100, Math.round((p.timesUsed / p.usageLimit) * 100)) : 0
                  return (
                    <tr key={p.id} className="hover:bg-surface-2/40">
                      <td className="table-td">
                        <button onClick={() => copy(p.code)} title="Copy code" className="group inline-flex items-center gap-2 rounded-md border border-dashed border-line bg-surface-2 px-2.5 py-1 font-mono text-sm font-bold tracking-wide hover:border-brand">
                          {p.code} <Copy size={13} className="text-faint group-hover:text-brand" />
                        </button>
                        {p.description && <p className="mt-1 text-xs text-muted">{p.description}</p>}
                      </td>
                      <td className="table-td">
                        <p className="font-medium">{describe(p)}</p>
                        {p.perUserLimit && <p className="text-xs text-muted">{p.perUserLimit === 1 ? "Once per customer" : `${p.perUserLimit}× per customer`}</p>}
                      </td>
                      <td className="table-td min-w-32">
                        <p className="text-sm tabular-nums">{p.timesUsed}{p.usageLimit ? ` / ${p.usageLimit}` : ""}</p>
                        {p.usageLimit && (
                          <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-surface-2">
                            <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                          </div>
                        )}
                      </td>
                      <td className="table-td font-semibold tabular-nums">{money(p.totalDiscountGiven, p.currency)}</td>
                      <td className="table-td whitespace-nowrap text-xs text-muted">
                        {p.startsAt && <p>From {dateTime(p.startsAt)}</p>}
                        <p>{p.expiresAt ? `Until ${dateTime(p.expiresAt)}` : "No expiry"}</p>
                      </td>
                      <td className="table-td"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${cls}`}>{label}</span></td>
                      <td className="table-td">
                        <div className="flex justify-end gap-0.5">
                          <button className={`btn-icon ${p.active ? "hover:text-amber-600!" : "hover:text-emerald-600!"}`} title={p.active ? "Turn off" : "Turn on"} onClick={() => toggle(p)}><Power size={17} /></button>
                          <button className="btn-icon" title="Edit" onClick={() => setEditing(p)}><Pencil size={17} /></button>
                          {p.timesUsed === 0 && (
                            <button className="btn-icon hover:text-red-600!" title="Delete" onClick={() => setToDelete(p)}><Trash2 size={17} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing !== undefined && (
        <PromoForm promo={editing} currency={currency} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); load() }} />
      )}
      <ConfirmDialog
        open={!!toDelete}
        title="Delete promo code?"
        message={`${toDelete?.code} will be deleted. Customers won't be able to use it.`}
        busy={busy}
        onConfirm={remove}
        onClose={() => setToDelete(null)}
      />
    </div>
  )
}
