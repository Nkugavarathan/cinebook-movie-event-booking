import { Loader2 } from "lucide-react"

export function Spinner({ size = 20, className = "" }) {
  return <Loader2 size={size} className={`animate-spin ${className}`} />
}

export function PageLoader({ label = "Loading..." }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-muted">
      <Spinner size={28} className="text-brand" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      {Icon && (
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-surface-2 text-faint">
          <Icon size={26} />
        </span>
      )}
      <h3 className="mt-4 font-display text-xl font-semibold">{title}</h3>
      {text && <p className="mt-1 max-w-md text-sm text-muted">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

const STATUS = {
  CONFIRMED: ["Confirmed", "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"],
  PENDING: ["Awaiting payment", "bg-amber-500/15 text-amber-400 border-amber-500/30"],
  EXPIRED: ["Expired", "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"],
  CANCELLED: ["Cancelled", "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"],
  REFUNDED: ["Refunded", "bg-sky-500/15 text-sky-400 border-sky-500/30"],
}

export function StatusBadge({ status }) {
  const [label, cls] = STATUS[status] || [status, "bg-surface-2 text-muted border-line"]
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>
}

/** Centered confirm dialog. Closes on Escape / backdrop click unless busy. */
export function ConfirmModal({ open, title, children, confirmLabel, cancelLabel = "Keep it", busy, onConfirm, onClose }) {
  if (!open) return null
  const close = () => !busy && onClose()
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={close} onKeyDown={(e) => e.key === "Escape" && close()} role="presentation">
      <div role="dialog" aria-modal="true" aria-labelledby="confirm-title"
        className="w-full max-w-md rounded-t-3xl border border-line bg-surface p-6 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}>
        <h2 id="confirm-title" className="font-display text-xl font-bold">{title}</h2>
        <div className="mt-3 text-sm text-muted">{children}</div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button className="btn-ghost py-2.5" onClick={close} disabled={busy} autoFocus>{cancelLabel}</button>
          <button className="btn-primary py-2.5" onClick={onConfirm} disabled={busy}>
            {busy && <Spinner size={16} />} {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
