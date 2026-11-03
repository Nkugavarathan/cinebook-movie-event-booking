import { useEffect, useRef } from "react"
import { Bot } from "lucide-react"

/**
 * The assistant's avatar: a CineBook-branded tile with a robot mark.
 * idle: still; thinking: soft pulsing ring; listening: ring follows your voice;
 * speaking: the mark becomes equalizer bars that move with the reply.
 * mode: idle | listening | thinking | speaking
 */
export function AssistantAvatar({ size = 40, mode = "idle", levelRef }) {
  const ring = useRef(null)
  const bars = useRef([])

  useEffect(() => {
    let raf
    let smooth = 0
    let t = 0
    const tick = () => {
      t += 1
      const target = levelRef?.current || 0
      smooth += (target - smooth) * 0.25
      if (ring.current) {
        const live = mode === "listening" || mode === "speaking"
        ring.current.style.transform = live ? `scale(${(1.04 + smooth * 0.22).toFixed(3)})` : ""
        ring.current.style.opacity = live ? String(0.35 + smooth * 0.65) : ""
      }
      bars.current.forEach((el, i) => {
        if (!el) return
        const wobble = 0.55 + 0.45 * Math.sin(t / 5 + i * 1.7)
        el.style.transform = `scaleY(${Math.max(0.18, Math.min(1, smooth * 1.6 * wobble + 0.15)).toFixed(3)})`
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [mode, levelRef])

  const icon = Math.round(size * 0.5)
  return (
    <span className={`assist-avatar assist-avatar-${mode} relative inline-grid shrink-0 place-items-center`} style={{ width: size, height: size }} aria-hidden="true">
      <span ref={ring} className="assist-avatar-ring absolute -inset-[3px] rounded-full border-2 border-brand" />
      <span className="relative grid h-full w-full place-items-center rounded-full bg-linear-to-br from-brand to-brand-600 text-white shadow-lg shadow-brand/25">
        {mode === "speaking" ? (
          <span className="flex items-center gap-[12%]" style={{ height: icon, width: icon }}>
            {[0, 1, 2, 3].map((i) => (
              <span key={i} ref={(el) => (bars.current[i] = el)} className="h-full flex-1 origin-center rounded-full bg-white" />
            ))}
          </span>
        ) : (
          <Bot size={icon} strokeWidth={2} />
        )}
      </span>
    </span>
  )
}

/** Live bar waveform from a 0..1 level ref (mic input). */
export function Waveform({ levelRef, bars = 36, className = "" }) {
  const canvas = useRef(null)

  useEffect(() => {
    const c = canvas.current
    if (!c) return
    const dpr = window.devicePixelRatio || 1
    const history = new Array(bars).fill(0)
    let raf
    let frame = 0
    const color = getComputedStyle(c).color
    const draw = () => {
      const w = c.clientWidth
      const h = c.clientHeight
      if (c.width !== w * dpr) {
        c.width = w * dpr
        c.height = h * dpr
      }
      if (frame++ % 3 === 0) {
        history.shift()
        history.push(levelRef.current || 0)
      }
      const g = c.getContext("2d")
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      g.clearRect(0, 0, w, h)
      g.fillStyle = color
      const gap = 3
      const bw = Math.max(2, (w - gap * (bars - 1)) / bars)
      history.forEach((v, i) => {
        const bh = Math.max(3, Math.min(h, (0.08 + v) * h))
        const x = i * (bw + gap)
        g.globalAlpha = 0.35 + 0.65 * (i / bars)
        g.beginPath()
        g.roundRect(x, (h - bh) / 2, bw, bh, bw / 2)
        g.fill()
      })
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [levelRef, bars])

  return <canvas ref={canvas} className={className} aria-hidden="true" />
}

/** Three soft dots while the assistant is working. */
export function Thinking({ label = "Thinking" }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-muted" role="status" aria-live="polite">
      <span className="flex gap-1">
        <span className="assist-dot" />
        <span className="assist-dot [animation-delay:.15s]" />
        <span className="assist-dot [animation-delay:.3s]" />
      </span>
      {label}
    </span>
  )
}
