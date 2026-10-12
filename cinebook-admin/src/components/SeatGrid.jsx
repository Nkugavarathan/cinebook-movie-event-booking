import { rowLabel } from "../lib/format"

const TYPE_STYLE = {
  STANDARD: "bg-slate-200 border-slate-300 text-slate-600",
  PREMIUM: "bg-violet-200 border-violet-400 text-violet-800",
  VIP: "bg-amber-200 border-amber-400 text-amber-800",
}

const STATUS_STYLE = {
  BOOKED: "bg-brand border-brand text-white",
  HELD: "seat-held border-amber-400 text-amber-900",
}

/**
 * Seat grid for the admin. cells: Map("row:col" -> {type, active, status?}).
 * In design mode clicking cells / row labels / column numbers calls the handlers.
 */
export default function SeatGrid({ rows, columns, cells, onCell, onRow, onCol, interactive = false }) {
  const size = columns > 24 ? "h-5 w-5 text-[8px]" : "h-7 w-7 text-[10px]"

  return (
    <div className="overflow-x-auto pb-2">
      <div className="mx-auto w-max">
        <div className="mx-auto mb-6 w-3/4">
          <div className="h-1.5 rounded-[50%] bg-linear-to-r from-transparent via-slate-400 to-transparent" />
          <p className="mt-1.5 text-center text-[10px] font-semibold uppercase tracking-[0.3em] text-faint">Screen</p>
        </div>

        {interactive && (
          <div className="mb-1 flex gap-1 pl-8">
            {Array.from({ length: columns }, (_, i) => i + 1).map((c) => (
              <button key={c} type="button" onClick={() => onCol?.(c)} title={`Paint column ${c}`}
                className={`${size} rounded text-faint hover:bg-surface-2 hover:text-ink`}>
                {c}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-1">
          {Array.from({ length: rows }, (_, i) => i + 1).map((r) => (
            <div key={r} className="flex items-center gap-1">
              <button
                type="button"
                disabled={!interactive}
                onClick={() => onRow?.(r)}
                title={interactive ? `Paint row ${rowLabel(r)}` : undefined}
                className={`w-7 shrink-0 rounded text-center text-xs font-semibold text-muted ${interactive ? "hover:bg-surface-2 hover:text-ink" : ""}`}
              >
                {rowLabel(r)}
              </button>
              {Array.from({ length: columns }, (_, i) => i + 1).map((c) => {
                const cell = cells.get(`${r}:${c}`) || { type: "STANDARD", active: true }
                let cls
                if (!cell.active) cls = "border-dashed border-slate-200 bg-transparent text-transparent"
                else if (cell.status && STATUS_STYLE[cell.status]) cls = STATUS_STYLE[cell.status]
                else cls = TYPE_STYLE[cell.type] || TYPE_STYLE.STANDARD
                return (
                  <button
                    key={c}
                    type="button"
                    disabled={!interactive}
                    onClick={() => onCell?.(r, c)}
                    title={`${rowLabel(r)}${c}${cell.active ? ` · ${cell.type}` : " · gap"}${cell.status ? ` · ${cell.status}` : ""}`}
                    className={`${size} grid place-items-center rounded-t-md rounded-b-sm border font-semibold transition ${cls} ${
                      interactive ? "cursor-pointer hover:scale-110" : "cursor-default"
                    }`}
                  >
                    {cell.active ? c : ""}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function SeatGridLegend({ withStatus }) {
  const item = (cls, label) => (
    <span className="flex items-center gap-1.5"><span className={`h-3.5 w-3.5 rounded-sm border ${cls}`} />{label}</span>
  )
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
      {item(TYPE_STYLE.STANDARD, "Standard")}
      {item(TYPE_STYLE.PREMIUM, "Premium")}
      {item(TYPE_STYLE.VIP, "VIP")}
      {!withStatus && item("border-dashed border-slate-300", "Gap / aisle")}
      {withStatus && item(STATUS_STYLE.BOOKED, "Booked")}
      {withStatus && item(STATUS_STYLE.HELD, "Held (paying)")}
    </div>
  )
}
