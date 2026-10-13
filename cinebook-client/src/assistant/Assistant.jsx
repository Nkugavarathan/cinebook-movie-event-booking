import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { ArrowRight, ArrowUp, Check, Ellipsis, LogIn, Maximize2, Mic, Minimize2, RotateCcw, Square, Volume2, VolumeX, X } from "lucide-react"
import api, { errorMessage } from "../services/api"
import { useAuth } from "../context/AuthContext"
import { Orb, Thinking, Waveform } from "./Visuals"
import Cards from "./Cards"
import { canListen, unlockAudio, useListener, useSpeaker } from "./voice"

const HISTORY_KEY = "cinebook_assistant_chat"
const PREFS_KEY = "cinebook_assistant_prefs"
const RESUME_KEY = "cinebook_assistant_resume"

const LANGUAGES = [
  { id: "en-US", label: "English" },
  { id: "si-LK", label: "Sinhala" },
  { id: "ta-IN", label: "Tamil" },
]

const SUGGESTIONS = [
  "What's showing tonight?",
  "Book 2 tickets for the next show of Dune",
  "Any concerts this weekend?",
  "Show my upcoming tickets",
]

function load(key, fallback, store = localStorage) {
  try {
    const v = store.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch {
    return fallback
  }
}

function save(key, value, store = localStorage) {
  try {
    store.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable: keep it in memory only */
  }
}

function greeting(name) {
  const h = new Date().getHours()
  const part = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"
  return name ? `${part}, ${name.split(" ")[0]}` : part
}

let nextId = Date.now()
const uid = () => ++nextId

export default function Assistant() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const [config, setConfig] = useState(null)
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [menu, setMenu] = useState(false)
  const [messages, setMessages] = useState(() => load(HISTORY_KEY, [], sessionStorage))
  const [draft, setDraft] = useState("")
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(null)
  const [prefs, setPrefs] = useState(() => ({ speak: true, voice: null, lang: "en-US", ...load(PREFS_KEY, {}) }))
  const handsFree = useRef(false)
  const scroller = useRef(null)
  const input = useRef(null)
  const messagesRef = useRef(messages)

  useEffect(() => {
    messagesRef.current = messages
    save(HISTORY_KEY, messages.slice(-40), sessionStorage)
  }, [messages])
  useEffect(() => save(PREFS_KEY, prefs), [prefs])

  useEffect(() => {
    api.get("/assistant/status").then((r) => setConfig(r.data)).catch(() => setConfig({ enabled: false }))
  }, [])

  const speaker = useSpeaker()
  const voice = prefs.voice || config?.defaultVoice

  /* ------------------------------------------------------------ sending */

  const runActions = useCallback((actions) => {
    for (const a of actions || []) {
      if (a.type === "navigate" && a.path) {
        navigate(a.path)
        // on phones the panel covers the page: step aside so the page is visible
        if (window.matchMedia("(max-width: 639px)").matches) setOpen(false)
      }
      if (a.type === "login") save(RESUME_KEY, true, sessionStorage)
    }
  }, [navigate])

  const listenerRef = useRef(null)

  const send = useCallback(async (raw, { viaVoice = false } = {}) => {
    const text = raw.trim()
    if (!text || busy) return
    unlockAudio()
    speaker.stop()
    setNotice(null)
    setMenu(false)
    handsFree.current = viaVoice
    const userMsg = { id: uid(), role: "user", text }
    const history = [...messagesRef.current, userMsg]
    setMessages(history)
    setDraft("")
    setBusy(true)
    try {
      const res = await api.post("/assistant/chat", {
        messages: history.filter((m) => !m.error).map((m) => ({ role: m.role, text: m.text })),
        path: window.location.pathname,
        language: prefs.lang,
      }, { timeout: 90000 })
      const r = res.data
      const reply = { id: uid(), role: "assistant", text: r.reply, cards: r.cards, actions: r.actions }
      setMessages((m) => [...m, reply])
      setBusy(false)
      runActions(r.actions)
      if (prefs.speak || viaVoice) {
        await speaker.speak(r.reply, voice)
        // hands-free: after answering a spoken question, listen again
        if (handsFree.current && !(r.actions || []).some((a) => a.type === "login")) {
          listenerRef.current?.start()
        }
      }
    } catch (err) {
      setBusy(false)
      handsFree.current = false
      setMessages((m) => [...m, { id: uid(), role: "assistant", error: true, text: errorMessage(err, "Sorry, something went wrong. Please try again.") }])
    }
  }, [busy, speaker, prefs.speak, prefs.lang, voice, runActions])

  const listener = useListener({
    lang: prefs.lang,
    onFinal: (text) => {
      if (text) send(text, { viaVoice: true })
      else {
        handsFree.current = false
        setNotice("I didn't catch that. Tap the microphone and try again.")
      }
    },
    onError: (msg) => {
      handsFree.current = false
      setNotice(msg)
    },
  })
  listenerRef.current = listener

  // Signed in after the assistant asked for it: pick the conversation back up.
  useEffect(() => {
    if (user && load(RESUME_KEY, false, sessionStorage) && messagesRef.current.length) {
      save(RESUME_KEY, false, sessionStorage)
      setOpen(true)
      send("I've signed in now, please continue.")
    }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ------------------------------------------------------------ ui behaviour */

  useLayoutEffect(() => {
    const el = scroller.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
  }, [messages, busy, open, listener.interim])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (menu) setMenu(false)
        else if (listener.state === "listening") listener.cancel()
        else setOpen(false)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, menu, listener])

  useEffect(() => {
    if (open && listener.state === "idle" && !busy) input.current?.focus({ preventScroll: true })
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // auto-grow the text box
  useLayoutEffect(() => {
    const el = input.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 140) + "px"
  }, [draft])

  const talk = () => {
    unlockAudio()
    speaker.stop()
    setNotice(null)
    if (listener.state === "listening") listener.stop()
    else if (listener.state === "idle") listener.start()
  }

  const reset = () => {
    speaker.stop()
    listener.cancel()
    handsFree.current = false
    setMessages([])
    setNotice(null)
    setMenu(false)
    save(RESUME_KEY, false, sessionStorage)
  }

  const close = () => {
    setOpen(false)
    setMenu(false)
    handsFree.current = false
    listener.cancel()
  }

  const mode = listener.state === "listening" ? "listening"
    : busy || listener.state === "transcribing" ? "thinking"
      : speaker.speaking ? "speaking" : "idle"
  const levelRef = mode === "listening" ? listener.levelRef : speaker.levelRef
  const statusLine = {
    listening: "Listening...",
    thinking: listener.state === "transcribing" ? "Transcribing..." : "Working on it...",
    speaking: "Speaking...",
    idle: "Booking assistant",
  }[mode]

  const lastAssistant = useMemo(() => [...messages].reverse().find((m) => m.role === "assistant"), [messages])

  if (!config?.enabled) return null
  if (location.pathname.startsWith("/admin")) return null

  const lifted = location.pathname.startsWith("/book/")

  /* ------------------------------------------------------------ launcher */

  if (!open) {
    return (
      <button onClick={() => { unlockAudio(); setOpen(true) }}
        className={`assist-launcher no-print fixed right-4 z-[90] flex items-center gap-2.5 rounded-full border border-line bg-surface/90 py-1.5 pl-1.5 pr-4 text-left shadow-[0_12px_40px_-12px_rgb(0_0_0/0.45)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-faint sm:right-6 ${lifted ? "bottom-36 sm:bottom-28" : "bottom-4 sm:bottom-6"}`}
        aria-label="Open the CineBook booking assistant">
        <Orb size={34} mode={mode} levelRef={levelRef} />
        <span className="leading-tight">
          <span className="block text-sm font-semibold">{mode === "idle" ? "Ask CineBook" : statusLine}</span>
          <span className="block text-[11px] text-faint">{mode === "idle" ? "Book by voice or chat" : "Tap to open"}</span>
        </span>
      </button>
    )
  }

  /* ------------------------------------------------------------ panel */

  return (
    <section role="dialog" aria-label="CineBook booking assistant"
      className={`assist-panel no-print fixed inset-0 z-[90] flex flex-col overflow-hidden bg-bg sm:inset-auto sm:bottom-6 sm:right-6 sm:rounded-[28px] sm:border sm:border-line sm:bg-surface/95 sm:shadow-[0_30px_80px_-20px_rgb(0_0_0/0.55)] sm:backdrop-blur-2xl ${
        expanded ? "sm:h-[calc(100vh-3rem)] sm:w-[min(640px,calc(100vw-3rem))]" : "sm:h-[min(720px,calc(100vh-3rem))] sm:w-[440px]"}`}>

      {/* header */}
      <header className="relative flex items-center gap-3 border-b border-line px-4 py-3">
        <Orb size={36} mode={mode} levelRef={levelRef} />
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-[15px] font-semibold leading-tight">CineBook Concierge</h2>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <span className={`h-1.5 w-1.5 rounded-full ${mode === "idle" ? "bg-ok" : "bg-brand animate-pulse"}`} />
            {statusLine}
          </p>
        </div>
        <IconButton label={prefs.speak ? "Mute voice replies" : "Read replies aloud"} pressed={prefs.speak}
          onClick={() => { if (prefs.speak) speaker.stop(); setPrefs((p) => ({ ...p, speak: !p.speak })) }}>
          {prefs.speak ? <Volume2 size={17} /> : <VolumeX size={17} />}
        </IconButton>
        <IconButton label="Settings" pressed={menu} onClick={() => setMenu((m) => !m)}>
          <Ellipsis size={18} />
        </IconButton>
        <IconButton label={expanded ? "Smaller" : "Larger"} className="hidden sm:grid" onClick={() => setExpanded((e) => !e)}>
          {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </IconButton>
        <IconButton label="Close" onClick={close}>
          <X size={18} />
        </IconButton>

        {menu && (
          <div className="assist-pop absolute right-3 top-[calc(100%+6px)] z-10 w-64 rounded-2xl border border-line bg-surface p-2 shadow-2xl">
            <MenuLabel>Voice</MenuLabel>
            <div className="grid grid-cols-2 gap-1">
              {(config.voices || []).map((v) => (
                <button key={v.id} onClick={() => { setPrefs((p) => ({ ...p, voice: v.id, speak: true })); speaker.speak(`Hi, I'm ${v.label}. Happy to help you book.`, v.id) }}
                  className={`rounded-xl border px-2.5 py-2 text-left transition ${voice === v.id ? "border-brand bg-brand-soft" : "border-transparent hover:bg-surface-2"}`}>
                  <span className="block text-sm font-semibold">{v.label}</span>
                  <span className="block text-[11px] text-faint">{v.tone}</span>
                </button>
              ))}
            </div>
            <MenuLabel>Speech language</MenuLabel>
            <div className="flex gap-1">
              {LANGUAGES.map((l) => (
                <button key={l.id} onClick={() => setPrefs((p) => ({ ...p, lang: l.id }))}
                  className={`flex-1 rounded-xl border px-2 py-1.5 text-xs font-semibold transition ${prefs.lang === l.id ? "border-brand bg-brand-soft" : "border-line hover:bg-surface-2"}`}>
                  {l.label}
                </button>
              ))}
            </div>
            <div className="my-2 h-px bg-line" />
            <button onClick={reset} className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium transition hover:bg-surface-2">
              <RotateCcw size={15} className="text-muted" /> New conversation
            </button>
          </div>
        )}
      </header>

      {/* conversation */}
      <div ref={scroller} className="assist-scroll flex-1 overflow-y-auto overscroll-contain px-4 py-5" onClick={() => setMenu(false)}>
        {messages.length === 0 ? (
          <Welcome name={user?.name} mode={mode} levelRef={levelRef} onTalk={canListen ? talk : null} onAsk={(t) => send(t)} />
        ) : (
          <ol className="space-y-5">
            {messages.map((m) => (
              <li key={m.id} className="assist-msg">
                {m.role === "user" ? (
                  <div className="flex justify-end">
                    <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-surface-2 px-3.5 py-2.5 text-[14px] leading-relaxed">{m.text}</p>
                  </div>
                ) : (
                  <div className="pr-2">
                    <p className={`whitespace-pre-wrap text-[14.5px] leading-relaxed ${m.error ? "text-brand" : ""}`}>{m.text}</p>
                    <Cards cards={m.cards} onOpen={(p) => runActions([{ type: "navigate", path: p }])} onAsk={(t) => send(t)} />
                    {(m.actions || []).some((a) => a.type === "login") && !user && (
                      <button onClick={() => { save(RESUME_KEY, true, sessionStorage); navigate("/login", { state: { from: location.pathname } }); if (window.matchMedia("(max-width: 639px)").matches) setOpen(false) }}
                        className="btn-primary mt-3 px-4 py-2 text-sm">
                        <LogIn size={15} /> Sign in to continue
                      </button>
                    )}
                    {m === lastAssistant && !m.error && !busy && (
                      <button onClick={() => (speaker.speaking ? speaker.stop() : (unlockAudio(), speaker.speak(m.text, voice)))}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-[11px] font-medium text-faint transition hover:bg-surface-2 hover:text-ink">
                        {speaker.speaking ? <><Square size={10} className="fill-current" /> Stop</> : <><Volume2 size={12} /> Listen</>}
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
            {busy && <li><Thinking label={listener.state === "transcribing" ? "Transcribing" : "Working on it"} /></li>}
          </ol>
        )}
      </div>

      {/* composer */}
      <footer className="border-t border-line p-3 pb-[max(.75rem,env(safe-area-inset-bottom))]">
        {notice && <p className="mb-2 rounded-xl bg-surface-2 px-3 py-2 text-xs text-muted" role="alert">{notice}</p>}

        {listener.state === "listening" ? (
          <div className="assist-listen flex items-center gap-3 rounded-2xl border border-brand/40 bg-brand-soft/60 px-3 py-2.5">
            <button onClick={listener.cancel} aria-label="Cancel" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted transition hover:bg-surface hover:text-ink">
              <X size={18} />
            </button>
            <div className="min-w-0 flex-1">
              <Waveform levelRef={listener.levelRef} className="h-7 w-full text-brand" />
              <p className="mt-0.5 line-clamp-2 text-xs text-muted">{listener.interim || "Listening - speak naturally"}</p>
            </div>
            <button onClick={listener.stop} aria-label="Done speaking" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-white shadow-lg shadow-brand/30 transition hover:bg-brand-600">
              <Check size={18} />
            </button>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); send(draft) }}
            className="flex items-end gap-2 rounded-2xl border border-line bg-surface-2 p-1.5 pl-3.5 transition focus-within:border-faint">
            <textarea ref={input} rows={1} value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={1000}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(draft) } }}
              placeholder={busy ? "Working on it..." : "Ask about movies, events or your tickets"}
              className="max-h-36 min-h-[2.25rem] flex-1 resize-none bg-transparent py-2 text-[14px] text-ink outline-none placeholder:text-faint" />
            {speaker.speaking && (
              <button type="button" onClick={speaker.stop} aria-label="Stop speaking" title="Stop speaking"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-muted transition hover:bg-surface hover:text-ink">
                <Square size={14} className="fill-current" />
              </button>
            )}
            {canListen && (
              <button type="button" onClick={talk} disabled={busy || listener.state !== "idle"} aria-label="Speak" title="Speak"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-muted transition hover:bg-surface hover:text-ink disabled:opacity-40">
                <Mic size={18} />
              </button>
            )}
            <button type="submit" disabled={busy || !draft.trim()} aria-label="Send"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ink text-bg transition hover:opacity-85 disabled:opacity-25">
              <ArrowUp size={18} />
            </button>
          </form>
        )}
        <p className="mt-2 text-center text-[10.5px] text-faint">The assistant can make mistakes. Payment always happens on the secure checkout page.</p>
      </footer>
    </section>
  )
}

function Welcome({ name, mode, levelRef, onTalk, onAsk }) {
  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-1 flex-col items-center justify-center px-2 pb-6 pt-4 text-center">
        <Orb size={88} mode={mode} levelRef={levelRef} />
        <h3 className="mt-6 font-display text-2xl font-semibold tracking-tight">{greeting(name)}</h3>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
          Tell me what you'd like to watch. I'll find the show, pick great seats and get your tickets ready.
        </p>
        {onTalk && (
          <button onClick={onTalk} className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-bg shadow-lg transition hover:opacity-90 active:scale-[.98]">
            <Mic size={16} /> Talk to book
          </button>
        )}
      </div>
      <div className="space-y-1.5">
        <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-faint">Try asking</p>
        {SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => onAsk(s)}
            className="group flex w-full items-center justify-between gap-3 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-left text-sm transition hover:border-faint hover:bg-surface-2">
            {s}
            <ArrowRight size={15} className="shrink-0 text-faint transition group-hover:translate-x-0.5 group-hover:text-ink" />
          </button>
        ))}
      </div>
    </div>
  )
}

function IconButton({ label, pressed, className = "grid", children, ...props }) {
  return (
    <button type="button" aria-label={label} title={label} aria-pressed={pressed}
      className={`${className} h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-ink`} {...props}>
      {children}
    </button>
  )
}

function MenuLabel({ children }) {
  return <p className="px-1.5 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-wider text-faint">{children}</p>
}
