import { useEffect, useState } from "react"
import { Minus, Plus, Popcorn } from "lucide-react"
import { toast } from "sonner"
import api, { errorMessage } from "../services/api"
import { money } from "../lib/format"
import { Spinner } from "./ui"

/** Add popcorn, drinks and combos to a held booking. Every change is priced by the server. */
export default function SnackPicker({ booking, onChange }) {
  const [menu, setMenu] = useState(null)
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    api.get("/snacks").then((res) => setMenu(res.data)).catch(() => setMenu([]))
  }, [])

  if (!menu || menu.length === 0) return null

  const qty = Object.fromEntries((booking.snacks || []).map((s) => [s.snackId, s.quantity]))

  const change = async (snackId, delta) => {
    const next = { ...qty, [snackId]: Math.max(0, (qty[snackId] || 0) + delta) }
    setBusyId(snackId)
    try {
      const items = Object.entries(next)
        .filter(([, q]) => q > 0)
        .map(([id, quantity]) => ({ snackId: Number(id), quantity }))
      const res = await api.put(`/bookings/${booking.id}/snacks`, { items })
      onChange(res.data)
    } catch (err) {
      toast.error(errorMessage(err, "Could not update snacks"))
    } finally {
      setBusyId(null)
    }
  }

  const groups = {}
  menu.forEach((s) => {
    const key = s.category || "Snacks"
    ;(groups[key] = groups[key] || []).push(s)
  })

  return (
    <div className="mt-6 border-t border-line pt-5">
      <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
        <Popcorn size={19} className="text-brand" /> Add snacks
      </h3>
      <p className="mt-1 text-sm text-muted">Skip the queue. Collect them at the snack counter with your ticket.</p>

      <div className="mt-4 space-y-5">
        {Object.entries(groups).map(([category, items]) => (
          <div key={category}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-faint">{category}</p>
            <ul className="space-y-2">
              {items.map((s) => {
                const q = qty[s.id] || 0
                const busy = busyId === s.id
                return (
                  <li key={s.id} className={`flex items-center gap-3 rounded-xl border p-3 transition ${q ? "border-brand/40 bg-brand-soft" : "border-line"}`}>
                    {s.imageUrl ? (
                      <img src={s.imageUrl} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-surface-2 text-faint"><Popcorn size={20} /></span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{s.name}</p>
                      {s.description && <p className="truncate text-xs text-muted">{s.description}</p>}
                      <p className="mt-0.5 text-sm font-medium tabular-nums">{money(s.price, s.currency)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button type="button" onClick={() => change(s.id, -1)} disabled={!q || busyId !== null}
                        aria-label={`Remove one ${s.name}`}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted transition hover:text-ink disabled:opacity-40">
                        <Minus size={15} />
                      </button>
                      <span className="grid w-7 place-items-center text-sm font-semibold tabular-nums" aria-live="polite">
                        {busy ? <Spinner size={14} /> : q}
                      </span>
                      <button type="button" onClick={() => change(s.id, 1)} disabled={q >= 10 || busyId !== null}
                        aria-label={`Add one ${s.name}`}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted transition hover:border-brand hover:text-brand disabled:opacity-40">
                        <Plus size={15} />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
