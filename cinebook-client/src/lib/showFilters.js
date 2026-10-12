/** Show-time buckets (by start time). */
export const TIME_SLOTS = [
  { value: "morning", label: "Morning", hint: "12:00-11:59 AM", from: 0, to: 12 * 60 },
  { value: "afternoon", label: "Afternoon", hint: "12:00-3:59 PM", from: 12 * 60, to: 16 * 60 },
  { value: "evening", label: "Evening", hint: "4:00-6:59 PM", from: 16 * 60, to: 19 * 60 },
  { value: "night", label: "Night", hint: "7:00-11:59 PM", from: 19 * 60, to: 24 * 60 },
]

function minutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number)
  return h * 60 + m
}

export function timeSlotOf(show) {
  const m = minutes(show.startTime)
  return TIME_SLOTS.find((s) => m >= s.from && m < s.to)?.value
}

/** Rounds a raw step up to 1, 2, 2.5 or 5 x 10^n so range labels look tidy. */
function niceStep(raw) {
  const p = 10 ** Math.floor(Math.log10(raw))
  const n = raw / p
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p
}

/**
 * Up to 4 price ranges covering the starting prices of the given shows, e.g. $5-$10, $10-$15.
 * Each range is [lo, hi); the last one includes its upper bound.
 */
export function priceBuckets(shows) {
  const prices = shows.map((s) => Number(s.priceStandard)).filter((p) => !Number.isNaN(p))
  if (prices.length === 0) return []
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  if (min === max) return [{ value: `${min}-${max}`, lo: min, hi: max, last: true }]
  const step = niceStep((max - min) / 3)
  const buckets = []
  for (let lo = Math.floor(min / step) * step; lo <= max; lo += step) {
    buckets.push({ value: `${lo}-${lo + step}`, lo, hi: lo + step, last: false })
  }
  buckets[buckets.length - 1].last = true
  return buckets
}

export function inBucket(show, bucket) {
  const p = Number(show.priceStandard)
  return p >= bucket.lo && (p < bucket.hi || (bucket.last && p <= bucket.hi))
}
