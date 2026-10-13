import { useState } from "react"
import { Star } from "lucide-react"

/** Read-only stars; supports halves via a clipped overlay. */
export function Stars({ value = 0, size = 16, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)))
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star size={size} className="absolute inset-0 text-line" fill="currentColor" />
            {fill > 0 && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star size={size} className="text-amber-400" fill="currentColor" />
              </span>
            )}
          </span>
        )
      })}
    </span>
  )
}

const LABELS = ["", "Poor", "Fair", "Good", "Great", "Loved it"]

/** Clickable 1-5 star picker (keyboard: arrow keys via radio group). */
export function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0)
  const shown = hover || value
  return (
    <div className="flex items-center gap-3">
      <div role="radiogroup" aria-label="Your rating" className="flex" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={value === i}
            aria-label={`${i} star${i > 1 ? "s" : ""}`}
            onMouseEnter={() => setHover(i)}
            onClick={() => onChange(i)}
            className="p-0.5 transition hover:scale-110"
          >
            <Star size={30} className={i <= shown ? "text-amber-400" : "text-line"} fill="currentColor" />
          </button>
        ))}
      </div>
      <span className="text-sm font-medium text-muted">{LABELS[shown]}</span>
    </div>
  )
}

/** Compact "★ 4.6 (12)" chip for cards. */
export function RatingChip({ avg, count, className = "" }) {
  if (!count) return null
  return (
    <span className={`inline-flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] font-bold text-white backdrop-blur-sm ${className}`}
      title={`${avg} out of 5 from ${count} review${count > 1 ? "s" : ""}`}>
      <Star size={11} className="text-amber-400" fill="currentColor" />
      {avg.toFixed(1)}
      <span className="font-medium text-white/70">({count})</span>
    </span>
  )
}
