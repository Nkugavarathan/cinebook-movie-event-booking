import { useCallback, useEffect, useRef, useState } from "react"
import api from "../services/api"

/* ------------------------------------------------------------------ audio context */

let ctx = null

/** One shared AudioContext; call from a click/tap so the browser allows sound. */
export function unlockAudio() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    if (!ctx) ctx = new AC()
    if (ctx.state === "suspended") ctx.resume()
    return ctx
  } catch {
    return null
  }
}

/** Reads a 0..1 loudness value from an analyser, for the waveform and the orb. */
function levelOf(analyser, buf) {
  analyser.getByteTimeDomainData(buf)
  let sum = 0
  for (let i = 0; i < buf.length; i++) {
    const v = (buf[i] - 128) / 128
    sum += v * v
  }
  return Math.min(1, Math.sqrt(sum / buf.length) * 3.2)
}

/* ------------------------------------------------------------------ listening */

const SR = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null
export const canListen = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia

/**
 * Microphone input. Uses the browser's live speech recognition when available (instant captions),
 * otherwise records a clip, stops on silence and transcribes it on the server.
 * state: idle | listening | transcribing. levelRef.current is the live mic level (0..1).
 */
export function useListener({ lang, onFinal, onError }) {
  const [state, setState] = useState("idle")
  const [interim, setInterim] = useState("")
  const levelRef = useRef(0)
  const session = useRef(null)
  const handlers = useRef({ onFinal, onError })
  useEffect(() => {
    handlers.current = { onFinal, onError }
  })

  const cleanup = useCallback(() => {
    const s = session.current
    if (!s) return
    cancelAnimationFrame(s.raf)
    clearTimeout(s.timer)
    s.stream?.getTracks().forEach((t) => t.stop())
    try {
      s.source?.disconnect()
    } catch {
      /* already disconnected */
    }
    levelRef.current = 0
    session.current = null
  }, [])

  const finish = useCallback((text) => {
    cleanup()
    setState("idle")
    setInterim("")
    handlers.current.onFinal?.((text || "").trim())
  }, [cleanup])

  const fail = useCallback((message) => {
    cleanup()
    setState("idle")
    setInterim("")
    handlers.current.onError?.(message)
  }, [cleanup])

  const start = useCallback(async () => {
    if (session.current) return
    const s = { cancelled: false }
    session.current = s
    setInterim("")
    setState("listening")

    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
    } catch {
      session.current = null
      setState("idle")
      handlers.current.onError?.("Microphone access is blocked. Allow it in your browser's address bar to talk.")
      return
    }
    if (s.cancelled) {
      stream.getTracks().forEach((t) => t.stop())
      return
    }
    s.stream = stream

    // live level meter (also drives silence detection in recording mode)
    const ac = unlockAudio()
    let analyser = null
    const buf = new Uint8Array(1024)
    if (ac) {
      s.source = ac.createMediaStreamSource(stream)
      analyser = ac.createAnalyser()
      analyser.fftSize = 1024
      s.source.connect(analyser)
    }
    let heardAt = 0
    let quietSince = 0
    const startedAt = performance.now()
    const tick = () => {
      if (session.current !== s) return
      const level = analyser ? levelOf(analyser, buf) : 0
      levelRef.current = level
      if (s.recorder && analyser) {
        const now = performance.now()
        if (level > 0.09) {
          heardAt = heardAt || now
          quietSince = 0
        } else if (heardAt) {
          quietSince = quietSince || now
          if (now - quietSince > 1400) return s.recorder.state === "recording" && s.recorder.stop()
        }
        if (!heardAt && now - startedAt > 8000) return s.recorder.state === "recording" && s.recorder.stop()
      }
      s.raf = requestAnimationFrame(tick)
    }
    s.raf = requestAnimationFrame(tick)

    if (SR) {
      const rec = new SR()
      s.rec = rec
      rec.lang = lang
      rec.interimResults = true
      rec.continuous = false
      rec.maxAlternatives = 1
      let finalText = ""
      rec.onresult = (e) => {
        let live = ""
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i]
          if (r.isFinal) finalText += r[0].transcript
          else live += r[0].transcript
        }
        setInterim((finalText + " " + live).trim())
      }
      rec.onerror = (e) => {
        s.error = e.error
      }
      rec.onend = () => {
        if (session.current !== s) return
        if (s.cancelled) return cleanup()
        if (s.error === "not-allowed" || s.error === "service-not-allowed") {
          return fail("Microphone access is blocked. Allow it in your browser's address bar to talk.")
        }
        if (s.error === "network") return fail("Voice recognition needs an internet connection.")
        finish(finalText)
      }
      try {
        rec.start()
      } catch {
        fail("Could not start voice recognition.")
      }
      s.timer = setTimeout(() => rec.stop(), 30000)
      return
    }

    // Fallback: record and transcribe on the server
    const type = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"].find((t) => window.MediaRecorder?.isTypeSupported?.(t))
    if (!window.MediaRecorder) return fail("Voice input is not supported in this browser.")
    const recorder = new MediaRecorder(stream, type ? { mimeType: type } : undefined)
    s.recorder = recorder
    const chunks = []
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data)
    recorder.onstop = async () => {
      if (session.current !== s || s.cancelled) return cleanup()
      cleanup()
      if (!heardAt) return finish("")
      setState("transcribing")
      try {
        const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" })
        const form = new FormData()
        form.append("audio", blob, "speech.webm")
        const res = await api.post("/assistant/transcribe", form, { headers: { "Content-Type": "multipart/form-data" } })
        setState("idle")
        handlers.current.onFinal?.((res.data.text || "").trim())
      } catch {
        setState("idle")
        handlers.current.onError?.("Sorry, I couldn't hear that clearly. Please try again.")
      }
    }
    recorder.start(250)
    s.timer = setTimeout(() => recorder.state === "recording" && recorder.stop(), 20000)
  }, [lang, cleanup, finish, fail])

  /** Stop listening and use what was said. */
  const stop = useCallback(() => {
    const s = session.current
    if (!s) return
    if (s.rec) s.rec.stop()
    else if (s.recorder?.state === "recording") s.recorder.stop()
    else finish("")
  }, [finish])

  /** Stop listening and discard. */
  const cancel = useCallback(() => {
    const s = session.current
    if (!s) return
    s.cancelled = true
    try {
      s.rec?.abort()
      if (s.recorder?.state === "recording") s.recorder.stop()
    } catch {
      /* ignore */
    }
    cleanup()
    setState("idle")
    setInterim("")
  }, [cleanup])

  useEffect(() => cancel, [cancel])

  return { state, interim, levelRef, start, stop, cancel }
}

/* ------------------------------------------------------------------ speaking */

/** "First sentence." + "the rest", so the first audio starts quickly. */
function chunks(text) {
  const sentences = text.match(/[^.!?]+[.!?]+["')\]]*\s*|[^.!?]+$/g) || [text]
  let first = sentences.shift() || ""
  while (first.length < 40 && sentences.length) first += sentences.shift()
  const rest = sentences.join("").trim()
  return [first.trim(), rest].filter(Boolean)
}

function browserVoice() {
  const voices = window.speechSynthesis?.getVoices() || []
  const pick = (re) => voices.find((v) => re.test(v.name) && /^en/i.test(v.lang))
  return pick(/natural|neural/i) || pick(/google uk english female|google us english|samantha|aria|jenny/i) || voices.find((v) => /^en/i.test(v.lang))
}

/** Plays replies in a natural voice (Gemini TTS on the server), falling back to the browser's voice. */
export function useSpeaker() {
  const [speaking, setSpeaking] = useState(false)
  const levelRef = useRef(0)
  const run = useRef(0)
  const current = useRef(null)

  const stop = useCallback(() => {
    run.current++
    const c = current.current
    current.current = null
    if (c?.audio) {
      c.audio.pause()
      c.audio.src = ""
    }
    if (c?.url) URL.revokeObjectURL(c.url)
    cancelAnimationFrame(c?.raf)
    window.speechSynthesis?.cancel()
    levelRef.current = 0
    setSpeaking(false)
  }, [])

  const playBlob = useCallback((blob, id) => new Promise((resolve) => {
    if (run.current !== id) return resolve()
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    const c = { audio, url }
    current.current = c
    const ac = unlockAudio()
    if (ac) {
      try {
        const src = ac.createMediaElementSource(audio)
        const analyser = ac.createAnalyser()
        analyser.fftSize = 1024
        src.connect(analyser)
        analyser.connect(ac.destination)
        const buf = new Uint8Array(1024)
        const tick = () => {
          if (current.current !== c) return
          levelRef.current = levelOf(analyser, buf)
          c.raf = requestAnimationFrame(tick)
        }
        c.raf = requestAnimationFrame(tick)
      } catch {
        /* plays without the level meter */
      }
    }
    const done = () => {
      cancelAnimationFrame(c.raf)
      URL.revokeObjectURL(url)
      levelRef.current = 0
      resolve()
    }
    audio.onended = done
    audio.onerror = done
    audio.play().catch(done)
  }), [])

  const speakBrowser = useCallback((text, id) => new Promise((resolve) => {
    const synth = window.speechSynthesis
    if (!synth || run.current !== id) return resolve()
    const u = new SpeechSynthesisUtterance(text)
    const v = browserVoice()
    if (v) u.voice = v
    u.rate = 1.02
    let pulse
    u.onstart = () => {
      pulse = setInterval(() => (levelRef.current = 0.25 + Math.random() * 0.35), 120)
    }
    u.onend = u.onerror = () => {
      clearInterval(pulse)
      levelRef.current = 0
      resolve()
    }
    synth.speak(u)
  }), [])

  /** Speaks the text; resolves when finished or stopped. */
  const speak = useCallback(async (text, voice) => {
    stop()
    const id = run.current
    setSpeaking(true)
    const parts = chunks(text)
    // request every part at once, play them in order
    const audio = parts.map((t) => api.post("/assistant/speech", { text: t, voice }, { responseType: "blob", timeout: 60000 })
      .then((r) => r.data)
      .catch(() => null))
    for (let i = 0; i < parts.length; i++) {
      if (run.current !== id) break
      const blob = await audio[i]
      if (run.current !== id) break
      if (blob && blob.size > 100) await playBlob(blob, id)
      else await speakBrowser(parts[i], id)
    }
    if (run.current === id) {
      current.current = null
      setSpeaking(false)
    }
  }, [stop, playBlob, speakBrowser])

  useEffect(() => stop, [stop])

  return { speaking, speak, stop, levelRef }
}
