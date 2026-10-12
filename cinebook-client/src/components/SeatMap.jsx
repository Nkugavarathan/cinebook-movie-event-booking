import { SEAT_TYPES } from "../lib/seatTypes"
import { money } from "../lib/format"


function rowLabel(n) {
  let s = ""
  while (n > 0) {
    const r = (n - 1) % 26
    s = String.fromCharCode(65 + r) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

/**
 * Interactive seat grid. Row A sits closest to the screen.
 * seats: [{id,row,col,label,type,active,status,price}]
 */
export default function SeatMap({ rows, columns, seats, selected, onToggle }) {
  const byPos = new Map(seats.map((s) => [`${s.row}:${s.col}`, s]))

  return (
    <div className="no-scrollbar overflow-x-auto pb-2">
      <div className="mx-auto w-max px-2">
        {/* Screen */}
        <div className="mb-10 px-6">
          <div className="mx-auto h-2 rounded-[50%] bg-linear-to-r from-transparent via-brand to-transparent shadow-[0_8px_40px_8px] shadow-brand/40" />
          <p className="mt-3 text-center text-[11px] font-semibold uppercase tracking-[0.4em] text-faint">Screen this way</p>
        </div>

        <div className="flex flex-col gap-2">
          {Array.from({ length: rows }, (_, r) => r + 1).map((row) => (
            <div key={row} className="flex items-center gap-2">
              <span className="w-6 text-center text-xs font-semibold text-faint">{rowLabel(row)}</span>
              <div className="flex gap-1.5">
                {Array.from({ length: columns }, (_, c) => c + 1).map((col) => {
                  const seat = byPos.get(`${row}:${col}`)
                  if (!seat || !seat.active) return <span key={col} className="h-7 w-7 sm:h-8 sm:w-8" aria-hidden />

                  const isSelected = selected.has(seat.id)
                  const isBooked = seat.status === "BOOKED"
                  const isHeld = seat.status === "HELD"
                  const t = SEAT_TYPES[seat.type] || SEAT_TYPES.STANDARD
                  const disabled = isBooked || isHeld

                  let cls = `border-2 bg-surface-2 text-muted ${t.ring}`
                  if (isSelected) cls = "border-2 border-brand bg-brand text-white shadow-lg shadow-brand/40 animate-[popIn_.25s_ease]"
                  else if (isBooked) cls = "border-2 border-transparent bg-zinc-800 text-zinc-600"
                  else if (isHeld) cls = "border-2 border-transparent seat-held text-zinc-500"

                  return (
                    <button
                      key={col}
                      type="button"
                      disabled={disabled}
                      onClick={() => onToggle(seat)}
                      title={`${seat.label} · ${t.label}${seat.price != null ? " · " + money(seat.price) : ""}${isBooked ? " · Booked" : isHeld ? " · Being booked" : ""}`}
                      aria-label={`Seat ${seat.label}${disabled ? " unavailable" : ""}`}
                      aria-pressed={isSelected}
                      className={`grid h-7 w-7 place-items-center rounded-t-lg rounded-b-sm text-[9px] font-bold transition sm:h-8 sm:w-8 sm:text-[10px] ${cls} ${
                        disabled ? "cursor-not-allowed" : "cursor-pointer hover:-translate-y-0.5"
                      }`}
                    >
                      {isBooked ? "×" : col}
                    </button>
                  )
                })}
              </div>
              <span className="w-6 text-center text-xs font-semibold text-faint">{rowLabel(row)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function SeatLegend({ prices, currency }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted">
      {Object.entries(SEAT_TYPES).map(([key, t]) =>
        prices?.[key] != null ? (
          <span key={key} className="flex items-center gap-2">
            <span className={`h-4 w-4 rounded-t-md rounded-b-sm border-2 bg-surface-2 ${t.ring}`} />
            {t.label} <span className="font-semibold text-ink">{money(prices[key], currency)}</span>
          </span>
        ) : null
      )}
      <span className="flex items-center gap-2"><span className="h-4 w-4 rounded-t-md rounded-b-sm bg-brand" />Selected</span>
      <span className="flex items-center gap-2"><span className="seat-held h-4 w-4 rounded-t-md rounded-b-sm" />Being booked</span>
      <span className="flex items-center gap-2"><span className="h-4 w-4 rounded-t-md rounded-b-sm bg-zinc-800" />Sold</span>
    </div>
  )
}
