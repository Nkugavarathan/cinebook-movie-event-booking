import { useEffect, useRef } from "react"

/**
 * The assistant's presence: a soft gradient orb. It breathes when idle, swirls while thinking,
 * and moves with the voice level while listening or speaking.
 * mode: idle | listening | thinking | speaking
 */
export function Orb({ size = 40, mode = "idle", levelRef }) {
  const core = useRef(null)
  const halo = useRef(null)

  useEffect(() => {
    let raf
    let smooth = 0
    const tick = () => {
      const target = levelRef?.current || 0
      smooth += (target - smooth) * 0.22
      const reactive = mode === "listening" || mode === "speaking"
      const s = reactive ? 1 + smooth * 0.32 : 1
      if (core.current) core.current.style.transform = `scale(${s.toFixed(3)})`
      if (halo.current) {
        halo.current.style.transform = `scale(${(reactive ? 1.08 + smooth * 0.55 : 1).toFixed(3)})`
        halo.current.style.opacity = reactive ? String(0.35 + smooth * 0.6) : ""
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [mode, levelRef])

  return (
    <span className={`orb orb-${mode} relative inline-grid shrink-0 place-items-center`} style={{ width: size, height: size }} aria-hidden="true">
      <span ref={halo} className="orb-halo absolute inset-0 rounded-full" />
      <span ref={core} className="orb-core absolute inset-0 overflow-hidden rounded-full">
        <span className="orb-swirl absolute -inset-1/4" />
        <span className="orb-gloss absolute inset-0 rounded-full" />
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
