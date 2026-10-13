import { useState } from "react"
import { BadgePercent, Check, X } from "lucide-react"
import { toast } from "sonner"
import api, { errorMessage } from "../services/api"
import { money } from "../lib/format"
import { Spinner } from "./ui"

/** Apply / remove a promo code on a held booking. The server computes the discount. */
export default function PromoBox({ booking, onChange }) {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  const apply = async (e) => {
    e.preventDefault()
    if (!code.trim()) return
    setBusy(true)
    setError("")
    try {
      const res = await api.post(`/bookings/${booking.id}/promo`, { code: code.trim() })
      onChange(res.data)
      setCode("")
      setOpen(false)
      toast.success(`${res.data.promoCode} applied - you save ${money(res.data.discountAmount, res.data.currency)}`)
    } catch (err) {
      setError(errorMessage(err, "That code can't be used"))
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      const res = await api.delete(`/bookings/${booking.id}/promo`)
      onChange(res.data)
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (booking.promoCode) {
    return (
      <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-500/15 text-emerald-400"><Check size={16} /></span>
          <div className="min-w-0 text-sm">
            <p className="font-semibold"><span className="font-mono tracking-wide">{booking.promoCode}</span> applied</p>
            <p className="text-emerald-400">You save {money(booking.discountAmount, booking.currency)}</p>
          </div>
        </div>
        <button onClick={remove} disabled={busy} className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink disabled:opacity-50">
          {busy ? <Spinner size={14} /> : <X size={15} />} Remove
        </button>
      </div>
    )
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline">
        <BadgePercent size={17} /> Have a promo code?
      </button>
    )
  }

  return (
    <form onSubmit={apply} className="mt-5">
      <label htmlFor="promo" className="mb-1.5 block text-sm font-medium">Promo code</label>
      <div className="flex gap-2">
        <input
          id="promo"
          autoFocus
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setError("") }}
          placeholder="e.g. FIRSTSHOW20"
          maxLength={40}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={!!error}
          aria-describedby={error ? "promo-error" : undefined}
          className="input py-2.5 font-mono uppercase tracking-wide"
        />
        <button type="submit" disabled={busy || !code.trim()} className="btn-primary shrink-0 px-5 py-2.5">
          {busy ? <Spinner size={16} /> : "Apply"}
        </button>
      </div>
      {error && <p id="promo-error" className="mt-1.5 text-xs font-medium text-brand">{error}</p>}
      <button type="button" onClick={() => { setOpen(false); setError(""); setCode("") }} className="mt-2 text-xs text-muted hover:text-ink">
        Cancel
      </button>
    </form>
  )
}
