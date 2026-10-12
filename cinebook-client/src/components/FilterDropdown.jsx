import { useEffect, useId, useRef, useState } from "react"
import { ChevronDown } from "lucide-react"

/**
 * Checkbox dropdown for filters.
 * options: [{ value, label, hint?, count? }]; selected: Set of values.
 */
export default function FilterDropdown({ label, shortLabel, options, selected, onChange, align = "left" }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    const esc = (e) => e.key === "Escape" && setOpen(false)
    document.addEventListener("mousedown", close)
    document.addEventListener("keydown", esc)
    return () => {
      document.removeEventListener("mousedown", close)
      document.removeEventListener("keydown", esc)
    }
  }, [open])

  const toggle = (value) => {
    const next = new Set(selected)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    onChange(next)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className={`flex h-full w-full items-center justify-between gap-3 px-4 py-3 text-sm font-medium transition hover:bg-surface-2 ${
          selected.size ? "text-brand" : "text-ink"
        }`}
      >
        <span className="flex items-center gap-2">
          {shortLabel ? (
            <>
              <span className="sm:hidden">{shortLabel}</span>
              <span className="hidden sm:inline">{label}</span>
            </>
          ) : label}
          {selected.size > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1.5 text-[11px] font-bold text-white">{selected.size}</span>
          )}
        </span>
        <ChevronDown size={18} className={`text-muted transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          id={panelId}
          className={`absolute top-full z-30 mt-1 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-line bg-surface p-1.5 shadow-2xl shadow-black/20 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {options.length === 0 && <p className="px-3 py-2.5 text-sm text-muted">No options for this date.</p>}
          {options.map((o) => {
            const disabled = o.count === 0 && !selected.has(o.value)
            return (
              <label
                key={o.value}
                className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition hover:bg-surface-2 ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 shrink-0 accent-brand"
                  checked={selected.has(o.value)}
                  disabled={disabled}
                  onChange={() => toggle(o.value)}
                />
                <span className="flex-1 font-medium">{o.label}</span>
                {o.hint && <span className="text-xs text-faint">{o.hint}</span>}
                {o.count != null && <span className="w-6 text-right text-xs tabular-nums text-faint">{o.count}</span>}
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}
