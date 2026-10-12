import { useEffect, useState } from "react"
import { Timer } from "lucide-react"
import { parseDateTime } from "../lib/format"

/** Counts down to an ISO local datetime and calls onExpire once when it hits zero. */
export default function Countdown({ until, onExpire }) {
  const target = parseDateTime(until).getTime()
  const [left, setLeft] = useState(() => Math.max(0, target - Date.now()))

  useEffect(() => {
    const t = setInterval(() => {
      const ms = Math.max(0, target - Date.now())
      setLeft(ms)
      if (ms === 0) {
        clearInterval(t)
        onExpire?.()
      }
    }, 1000)
    return () => clearInterval(t)
  }, [target, onExpire])

  const mins = Math.floor(left / 60000)
  const secs = Math.floor((left % 60000) / 1000)
  const urgent = left < 120000

  return (
    <div className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold tabular-nums ${
      urgent ? "border-brand/40 bg-brand-soft text-brand" : "border-line bg-surface-2 text-ink"
    }`}>
      <Timer size={16} />
      {mins}:{secs.toString().padStart(2, "0")}
      <span className="font-normal text-muted">left to pay</span>
    </div>
  )
}
