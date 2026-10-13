import { useState } from "react"
import { Shuffle } from "lucide-react"
import { toast } from "sonner"
import api, { errorMessage } from "../../../api/axios"
import { Modal, Spinner } from "../../../components/ui"
import { money } from "../../../lib/format"

const toInput = (v) => (v ? v.slice(0, 16) : "") // "2026-10-14T10:00:00" -> datetime-local value

function randomCode() {
  const words = ["MOVIE", "CINE", "SHOW", "POPCORN", "REEL", "FLICK", "STAR"]
  return `${words[Math.floor(Math.random() * words.length)]}${Math.floor(10 + Math.random() * 90)}`
}

/** Create / edit a promo code. Mounted only while open. */
export default function PromoForm({ promo, currency = "lkr", onClose, onSaved }) {
  const [f, setF] = useState(() => ({
    code: promo?.code || "",
    description: promo?.description || "",
    discountType: promo?.discountType || "PERCENT",
    discountValue: promo?.discountValue ?? "",
    maxDiscount: promo?.maxDiscount ?? "",
    minOrderAmount: promo?.minOrderAmount ?? "",
    startsAt: toInput(promo?.startsAt),
    expiresAt: toInput(promo?.expiresAt),
    usageLimit: promo?.usageLimit ?? "",
    perUserLimit: promo?.perUserLimit ?? (promo ? "" : 1),
    active: promo ? promo.active : true,
  }))
  const [saving, setSaving] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value })
  const cur = currency.toUpperCase()
  const percent = f.discountType === "PERCENT"
  const used = promo?.timesUsed > 0

  const num = (v) => (v === "" || v == null ? null : Number(v))
  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    const body = {
      code: f.code.trim(),
      description: f.description,
      discountType: f.discountType,
      discountValue: num(f.discountValue),
      maxDiscount: percent ? num(f.maxDiscount) : null,
      minOrderAmount: num(f.minOrderAmount),
      startsAt: f.startsAt ? `${f.startsAt}:00` : null,
      expiresAt: f.expiresAt ? `${f.expiresAt}:00` : null,
      usageLimit: num(f.usageLimit),
      perUserLimit: num(f.perUserLimit),
      active: f.active,
    }
    try {
      const res = promo ? await api.put(`/promos/${promo.id}`, body) : await api.post("/promos", body)
      toast.success(promo ? `${res.data.code} updated` : `${res.data.code} created`)
      onSaved()
    } catch (err) {
      toast.error(errorMessage(err, "Could not save promo code"))
    } finally {
      setSaving(false)
    }
  }

  const value = Number(f.discountValue) || 0
  const preview = !value ? "Set a discount to see the preview"
    : percent
      ? `${value}% off${f.maxDiscount ? `, up to ${money(f.maxDiscount, currency)}` : ""}${f.minOrderAmount ? ` on orders over ${money(f.minOrderAmount, currency)}` : ""}`
      : `${money(value, currency)} off${f.minOrderAmount ? ` orders over ${money(f.minOrderAmount, currency)}` : ""}`

  return (
    <Modal open title={promo ? `Edit ${promo.code}` : "New promo code"} onClose={onClose}
      footer={<>
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button form="promo-form" className="btn-primary" disabled={saving}>{saving && <Spinner size={16} />} {promo ? "Save" : "Create code"}</button>
      </>}>
      <form id="promo-form" onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="p-code">Code</label>
          <div className="flex gap-2">
            <input id="p-code" className="input font-mono uppercase tracking-wide" required maxLength={40} placeholder="FIRSTSHOW20"
              value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase().replace(/\s/g, "") })}
              disabled={used} title={used ? "Codes that have been used can't be renamed" : undefined} />
            {!used && (
              <button type="button" className="btn-icon shrink-0 border border-line" title="Generate" onClick={() => setF({ ...f, code: randomCode() })}>
                <Shuffle size={16} />
              </button>
            )}
          </div>
        </div>
        <div>
          <label className="label" htmlFor="p-desc">Description <span className="font-normal text-muted">(admin note, optional)</span></label>
          <input id="p-desc" className="input" maxLength={200} placeholder="New customer offer" value={f.description} onChange={set("description")} />
        </div>

        <div>
          <p className="label">Discount</p>
          <div className="mb-2 inline-flex rounded-lg bg-surface-2 p-1">
            {[["PERCENT", "Percentage"], ["FIXED", `Fixed ${cur}`]].map(([k, l]) => (
              <button key={k} type="button" onClick={() => setF({ ...f, discountType: k })}
                className={`rounded-md px-4 py-1.5 text-sm font-semibold transition ${f.discountType === k ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"}`}>
                {l}
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-muted" htmlFor="p-val">{percent ? "Percent off *" : `Amount off (${cur}) *`}</label>
              <input id="p-val" type="number" min="0.01" max={percent ? 100 : undefined} step="0.01" required className="input"
                value={f.discountValue} onChange={set("discountValue")} placeholder={percent ? "20" : "500"} />
            </div>
            {percent && (
              <div>
                <label className="mb-1 block text-xs text-muted" htmlFor="p-max">Max discount ({cur})</label>
                <input id="p-max" type="number" min="0.01" step="0.01" className="input" value={f.maxDiscount} onChange={set("maxDiscount")} placeholder="No cap" />
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs text-muted" htmlFor="p-min">Minimum order ({cur})</label>
              <input id="p-min" type="number" min="0" step="0.01" className="input" value={f.minOrderAmount} onChange={set("minOrderAmount")} placeholder="Any order" />
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-muted" htmlFor="p-start">Starts</label>
            <input id="p-start" type="datetime-local" className="input" value={f.startsAt} onChange={set("startsAt")} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted" htmlFor="p-end">Expires</label>
            <input id="p-end" type="datetime-local" className="input" value={f.expiresAt} onChange={set("expiresAt")} />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted" htmlFor="p-limit">Total uses</label>
            <input id="p-limit" type="number" min="1" className="input" value={f.usageLimit} onChange={set("usageLimit")} placeholder="Unlimited" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted" htmlFor="p-user">Uses per customer</label>
            <input id="p-user" type="number" min="1" className="input" value={f.perUserLimit} onChange={set("perUserLimit")} placeholder="Unlimited" />
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-3">
          <input type="checkbox" className="h-4 w-4 accent-brand" checked={f.active} onChange={set("active")} />
          <span className="text-sm font-medium">Active - customers can use this code</span>
        </label>

        <div className="rounded-lg border border-dashed border-line bg-surface-2/60 p-3 text-sm">
          <span className="text-muted">Customers see: </span>
          <span className="font-mono font-semibold">{f.code || "CODE"}</span>
          <span className="text-muted"> - </span>
          <span className="font-medium">{preview}</span>
        </div>
      </form>
    </Modal>
  )
}
