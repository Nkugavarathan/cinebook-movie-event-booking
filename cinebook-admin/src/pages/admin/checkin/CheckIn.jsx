import { useCallback, useEffect, useRef, useState } from "react"
import { AlertTriangle, Camera, CameraOff, CheckCircle2, Keyboard, RotateCcw, ScanLine, Users, XCircle } from "lucide-react"
import { toast } from "sonner"
import api, { errorMessage } from "../../../api/axios"
import { PageHeader, Spinner } from "../../../components/ui"
import { time12 } from "../../../lib/format"

const READER_ID = "qr-reader"
const SAME_CODE_COOLDOWN_MS = 4000
const WARN_RESULTS = new Set(["WRONG_SHOW", "TOO_EARLY", "NOT_PAID"])

/** Short beep + vibration so staff don't need to look at the screen. */
function feedback(ok) {
  try {
    navigator.vibrate?.(ok ? 120 : [80, 60, 80, 60, 200])
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = ok ? "sine" : "square"
    osc.frequency.value = ok ? 880 : 220
    gain.gain.value = 0.08
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + (ok ? 0.15 : 0.4))
    osc.onended = () => ctx.close()
  } catch {
    /* audio not available */
  }
}

/** The show whose doors are open now (or the next one today). */
function pickCurrentShow(shows) {
  const now = new Date()
  const mins = now.getHours() * 60 + now.getMinutes()
  const toMin = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))
  const open = shows.filter((s) => toMin(s.startTime) - 180 <= mins && mins <= toMin(s.endTime || s.startTime) + 60)
  const candidates = open.length ? open : shows.filter((s) => toMin(s.startTime) >= mins)
  return candidates.sort((a, b) => Math.abs(toMin(a.startTime) - mins) - Math.abs(toMin(b.startTime) - mins))[0]
}

export default function CheckIn() {
  const [shows, setShows] = useState(null)
  const [showId, setShowId] = useState("")
  const [detail, setDetail] = useState(null)
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [code, setCode] = useState("")
  const [cameraOn, setCameraOn] = useState(false)
  const [cameraError, setCameraError] = useState("")
  const scannerRef = useRef(null)
  const lastScan = useRef({ code: "", at: 0 })
  const busyRef = useRef(false)
  const showIdRef = useRef("")

  useEffect(() => {
    showIdRef.current = showId
  }, [showId])

  // Today's shows; pre-select the one at the door now.
  useEffect(() => {
    api.get("/checkin/shows").then((res) => {
      setShows(res.data)
      const current = pickCurrentShow(res.data)
      if (current) setShowId(String(current.showtimeId))
    }).catch((err) => {
      toast.error(errorMessage(err))
      setShows([])
    })
  }, [])

  // Live door numbers for the selected show.
  const refresh = useCallback(() => {
    if (!showIdRef.current) return
    api.get(`/checkin/shows/${showIdRef.current}`).then((res) => setDetail(res.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!showId) return
    refresh()
    const t = setInterval(refresh, 10000)
    return () => clearInterval(t)
  }, [showId, refresh])

  const submit = useCallback(async (raw) => {
    const value = raw.trim()
    if (!value || busyRef.current) return
    const now = Date.now()
    if (value === lastScan.current.code && now - lastScan.current.at < SAME_CODE_COOLDOWN_MS) return
    lastScan.current = { code: value, at: now }
    busyRef.current = true
    setBusy(true)
    try {
      const res = await api.post("/checkin/scan", { code: value, showtimeId: showIdRef.current ? Number(showIdRef.current) : null })
      setResult(res.data)
      feedback(res.data.ok)
      if (res.data.ok) refresh()
    } catch (err) {
      setResult({ ok: false, result: "ERROR", title: "Couldn't check ticket", message: errorMessage(err) })
      feedback(false)
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }, [refresh])

  const stopCamera = useCallback(async () => {
    const s = scannerRef.current
    scannerRef.current = null
    setCameraOn(false)
    if (s) {
      try {
        await s.stop()
        s.clear()
      } catch {
        /* already stopped */
      }
    }
  }, [])

  const startCamera = async () => {
    setCameraError("")
    if (!window.isSecureContext) {
      setCameraError("The camera only works on HTTPS or localhost. On a phone, open the admin with `npm run dev:phone` (https://<PC-IP>:5174).")
      return
    }
    try {
      const { Html5Qrcode } = await import("html5-qrcode")
      const scanner = new Html5Qrcode(READER_ID, { verbose: false })
      scannerRef.current = scanner
      setCameraOn(true)
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: (w, h) => { const s = Math.floor(Math.min(w, h) * 0.7); return { width: s, height: s } } },
        (text) => submit(text),
        () => {}
      )
    } catch (err) {
      await stopCamera()
      const msg = String(err?.message || err)
      setCameraError(/permission|NotAllowed/i.test(msg)
        ? "Camera permission was denied. Allow camera access in the browser and try again."
        : /NotFound|no camera|Requested device not found/i.test(msg)
          ? "No camera found on this device. Use the code box or a USB scanner instead."
          : `Could not start the camera: ${msg}`)
    }
  }

  useEffect(() => () => { stopCamera() }, [stopCamera])

  const undo = async (bookingId) => {
    try {
      await api.post(`/checkin/undo/${bookingId}`)
      toast.success("Check-in undone")
      setResult(null)
      lastScan.current = { code: "", at: 0 }
      refresh()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const sold = detail?.soldSeats ?? 0
  const inSeats = detail?.checkedInSeats ?? 0
  const pct = sold ? Math.round((inSeats / sold) * 100) : 0
  const tone = !result ? "" : result.ok ? "ok" : WARN_RESULTS.has(result.result) ? "warn" : "bad"

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Ticket check-in" subtitle="Scan the QR code on the customer's ticket, or type the booking code." />

      {/* Show + live counter */}
      <div className="card p-5">
        <label className="label" htmlFor="show">Show at the door</label>
        <select id="show" className="input" value={showId} onChange={(e) => { setShowId(e.target.value); setDetail(null); setResult(null) }}>
          <option value="">Any show today (no show check)</option>
          {(shows || []).map((s) => (
            <option key={s.showtimeId} value={s.showtimeId}>
              {time12(s.startTime)} · {s.title} · {s.theaterName} {s.screenName} ({s.checkedInSeats}/{s.soldSeats})
            </option>
          ))}
        </select>
        {shows && shows.length === 0 && <p className="mt-2 text-sm text-muted">No shows scheduled today.</p>}

        {showId && (
          <div className="mt-5">
            <div className="flex items-end justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><Users size={20} /></span>
                <div>
                  <p className="text-xs font-medium text-muted">Checked in</p>
                  <p className="font-display text-3xl font-bold tabular-nums">
                    {inSeats} <span className="text-lg text-muted">/ {sold}</span>
                  </p>
                </div>
              </div>
              <p className="text-right text-sm text-muted">{Math.max(0, sold - inSeats)} still to arrive</p>
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Result */}
      {result && (
        <div
          role="status"
          aria-live="assertive"
          className={`mt-4 flex items-start gap-4 rounded-2xl border-2 p-5 ${
            tone === "ok" ? "border-emerald-500 bg-emerald-50" : tone === "warn" ? "border-amber-500 bg-amber-50" : "border-red-500 bg-red-50"
          }`}
        >
          {tone === "ok" ? <CheckCircle2 size={44} className="shrink-0 text-emerald-600" />
            : tone === "warn" ? <AlertTriangle size={44} className="shrink-0 text-amber-600" />
              : <XCircle size={44} className="shrink-0 text-red-600" />}
          <div className="min-w-0 flex-1">
            <p className={`font-display text-2xl font-bold ${tone === "ok" ? "text-emerald-700" : tone === "warn" ? "text-amber-700" : "text-red-700"}`}>
              {result.title}
            </p>
            <p className="mt-1 text-sm text-ink">{result.message}</p>
            {result.booking && (
              <p className="mt-2 text-xs text-muted">
                {result.booking.reference} · {result.booking.showtime.movieTitle} · {time12(result.booking.showtime.startTime)} · {result.booking.showtime.screenName}
              </p>
            )}
          </div>
          {result.ok && result.booking && (
            <button onClick={() => undo(result.booking.id)} className="btn-secondary shrink-0 px-3 py-2 text-xs"><RotateCcw size={14} /> Undo</button>
          )}
        </div>
      )}

      {/* Scanner */}
      <div className="card mt-4 overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <p className="flex items-center gap-2 font-semibold"><ScanLine size={18} /> Camera scanner</p>
          {cameraOn ? (
            <button onClick={stopCamera} className="btn-secondary px-3 py-2 text-sm"><CameraOff size={16} /> Stop</button>
          ) : (
            <button onClick={startCamera} className="btn-primary px-3 py-2 text-sm"><Camera size={16} /> Start camera</button>
          )}
        </div>
        <div className="relative bg-black">
          <div id={READER_ID} className={cameraOn ? "mx-auto w-full max-w-md" : "hidden"} />
          {!cameraOn && (
            <div className="flex aspect-video flex-col items-center justify-center gap-2 bg-surface-2 p-6 text-center text-sm text-muted">
              <Camera size={32} className="text-faint" />
              Start the camera and hold the ticket's QR code in the frame.
            </div>
          )}
          {busy && (
            <div className="absolute inset-0 grid place-items-center bg-black/40">
              <Spinner size={32} className="text-white" />
            </div>
          )}
        </div>
        {cameraError && <p className="border-t border-line bg-amber-50 px-5 py-3 text-sm text-amber-800">{cameraError}</p>}

        <form onSubmit={(e) => { e.preventDefault(); lastScan.current = { code: "", at: 0 }; submit(code); setCode("") }} className="flex gap-2 border-t border-line p-4">
          <div className="relative flex-1">
            <Keyboard size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="CB-XXXXXXX"
              aria-label="Booking code"
              autoComplete="off"
              spellCheck={false}
              className="input pl-9 font-mono uppercase tracking-wide"
            />
          </div>
          <button type="submit" disabled={!code.trim() || busy} className="btn-primary shrink-0">Check in</button>
        </form>
      </div>

      {/* Recent */}
      {showId && detail?.recent?.length > 0 && (
        <div className="card mt-4 overflow-hidden">
          <p className="border-b border-line px-5 py-3 font-semibold">Recently checked in</p>
          <ul className="divide-y divide-line">
            {detail.recent.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{b.contactName || b.userName} <span className="font-mono text-xs text-muted">{b.reference}</span></p>
                  <p className="text-xs text-muted">Seats {b.seatLabels} · {new Date(b.checkedInAt.replace(/(\.\d{3})\d+/, "$1")).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p>
                </div>
                <button onClick={() => undo(b.id)} className="btn-icon shrink-0" title="Undo check-in"><RotateCcw size={16} /></button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
