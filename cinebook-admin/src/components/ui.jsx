import { useEffect } from "react"
import { AlertTriangle, Loader2, X } from "lucide-react"

export function Spinner({ size = 18, className = "" }) {
  return <Loader2 size={size} className={`animate-spin ${className}`} />
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Empty({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      {Icon && (
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-surface-2 text-faint">
          <Icon size={24} />
        </span>
      )}
      <p className="mt-3 font-semibold">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Modal({ open, title, onClose, children, footer, wide }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        className={`max-h-[92vh] w-full overflow-hidden rounded-t-2xl bg-surface shadow-2xl sm:rounded-2xl ${wide ? "sm:max-w-4xl" : "sm:max-w-lg"} flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-lg font-semibold">{title}</h2>
          <button className="btn-icon" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line bg-surface-2/50 px-5 py-3">{footer}</div>}
      </div>
    </div>
  )
}

export function ConfirmDialog({ open, title, message, confirmLabel = "Delete", danger = true, busy, onConfirm, onClose }) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={busy}>Cancel</button>
          <button className={danger ? "btn bg-red-600 text-white hover:bg-red-700" : "btn-primary"} onClick={onConfirm} disabled={busy}>
            {busy && <Spinner size={16} />} {confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex gap-3">
        {danger && (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-50 text-red-600">
            <AlertTriangle size={20} />
          </span>
        )}
        <p className="text-sm text-muted">{message}</p>
      </div>
    </Modal>
  )
}

const STATUS = {
  CONFIRMED: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  PENDING: "bg-amber-50 text-amber-700 ring-amber-600/20",
  EXPIRED: "bg-slate-100 text-slate-600 ring-slate-500/20",
  CANCELLED: "bg-slate-100 text-slate-600 ring-slate-500/20",
  REFUNDED: "bg-sky-50 text-sky-700 ring-sky-600/20",
}

export function StatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS[status] || STATUS.CANCELLED}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  )
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }).map((_, i) => <div key={i} className="skeleton h-10" />)}
    </div>
  )
}
