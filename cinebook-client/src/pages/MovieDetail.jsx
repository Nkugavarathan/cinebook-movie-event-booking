import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, CalendarX, Clock, Clapperboard, Globe, MapPin, Play, Users } from "lucide-react"
import api, { errorMessage } from "../services/api"
import Poster from "../components/Poster"
import TrailerModal from "../components/TrailerModal"
import { DetailSkeleton } from "../components/Skeletons"
import { EmptyState } from "../components/ui"
import { dayChip, longDate, money, parseDate, runtime, time12 } from "../lib/format"

export default function MovieDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [date, setDate] = useState(null)
  const [city, setCity] = useState("All")
  const [trailer, setTrailer] = useState(false)

  useEffect(() => {
    api.get(`/movies/${id}`)
      .then((res) => {
        setData(res.data)
        setDate(res.data.showtimes[0]?.showDate || null)
      })
      .catch((err) => setError(errorMessage(err, "Movie not found")))
  }, [id])

  const dates = useMemo(() => [...new Set((data?.showtimes || []).map((s) => s.showDate))], [data])
  const cities = useMemo(() => ["All", ...new Set((data?.showtimes || []).map((s) => s.city).filter(Boolean))], [data])

  const byTheater = useMemo(() => {
    const groups = new Map()
    ;(data?.showtimes || [])
      .filter((s) => s.showDate === date && (city === "All" || s.city === city))
      .forEach((s) => {
        if (!groups.has(s.theaterId)) groups.set(s.theaterId, { theater: s, shows: [] })
        groups.get(s.theaterId).shows.push(s)
      })
    return [...groups.values()]
  }, [data, date, city])

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <EmptyState icon={Clapperboard} title="Movie not found" text={error} action={<Link to="/" className="btn-primary">Back to movies</Link>} />
      </div>
    )
  }
  if (!data) return <DetailSkeleton />

  const m = data.movie

  return (
    <div>
      {/* Header */}
      <section className="relative overflow-hidden">
        <img src={m.backdropUrl || m.posterUrl} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-30 blur-2xl" />
        <div className="absolute inset-0 bg-linear-to-t from-bg via-bg/80 to-bg/40" />
        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6">
          <button onClick={() => navigate(-1)} className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
            <ArrowLeft size={16} /> Back
          </button>
          <div className="grid gap-8 md:grid-cols-[260px_1fr]">
            <div className="mx-auto w-48 overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/60 md:mx-0 md:w-full">
              <Poster src={m.posterUrl} title={m.title} className="aspect-2/3 w-full" />
            </div>
            <div className="flex flex-col justify-end">
              <div className="flex flex-wrap items-center gap-2">
                {m.certificate && <span className="rounded-md border border-line bg-surface-2 px-2 py-0.5 text-xs font-bold">{m.certificate}</span>}
                {(m.genre || "").split(",").map((g) => g.trim()).filter(Boolean).map((g) => (
                  <span key={g} className="rounded-full bg-surface-2 px-3 py-0.5 text-xs font-medium text-muted">{g}</span>
                ))}
              </div>
              <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">{m.title}</h1>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
                {m.duration > 0 && <span className="flex items-center gap-1.5"><Clock size={15} />{runtime(m.duration)}</span>}
                {m.language && <span className="flex items-center gap-1.5"><Globe size={15} />{m.language}</span>}
                {m.releaseDate && <span>Released {longDate(m.releaseDate)}</span>}
              </div>
              <p className="mt-5 max-w-3xl leading-relaxed text-muted">{m.description}</p>
              <dl className="mt-5 grid max-w-3xl gap-3 text-sm sm:grid-cols-2">
                {m.director && (
                  <div><dt className="text-faint">Director</dt><dd className="mt-0.5 font-medium">{m.director}</dd></div>
                )}
                {m.castMembers && (
                  <div><dt className="flex items-center gap-1 text-faint"><Users size={13} />Cast</dt><dd className="mt-0.5 font-medium">{m.castMembers}</dd></div>
                )}
              </dl>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href="#showtimes" className="btn-primary px-7">Get tickets</a>
                {m.trailerUrl && (
                  <button onClick={() => setTrailer(true)} className="btn-ghost"><Play size={18} /> Trailer</button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Showtimes */}
      <section id="showtimes" className="mx-auto max-w-7xl scroll-mt-20 px-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold">Showtimes</h2>
            <p className="text-sm text-muted">Select a date and time to choose your seats.</p>
          </div>
          {cities.length > 2 && (
            <select value={city} onChange={(e) => setCity(e.target.value)} className="input w-auto py-2.5 text-sm">
              {cities.map((c) => <option key={c} value={c}>{c === "All" ? "All cities" : c}</option>)}
            </select>
          )}
        </div>

        {dates.length === 0 ? (
          <div className="mt-6">
            <EmptyState icon={CalendarX} title="No upcoming shows" text="This movie has no showtimes scheduled right now. Check back soon." />
          </div>
        ) : (
          <>
            <div className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
              {dates.map((d) => {
                const c = dayChip(d)
                const active = d === date
                return (
                  <button
                    key={d}
                    onClick={() => setDate(d)}
                    className={`flex w-20 shrink-0 flex-col items-center rounded-2xl border py-3 transition ${
                      active ? "border-brand bg-brand text-white shadow-lg shadow-brand/30" : "border-line bg-surface hover:border-faint"
                    }`}
                  >
                    <span className={`text-xs font-medium ${active ? "text-white/80" : "text-muted"}`}>{c.top}</span>
                    <span className="font-display text-2xl font-bold">{c.day}</span>
                    <span className={`text-xs ${active ? "text-white/80" : "text-muted"}`}>{c.month}</span>
                  </button>
                )
              })}
            </div>

            <div className="mt-6 space-y-4">
              {byTheater.length === 0 && (
                <p className="card p-6 text-center text-sm text-muted">No shows in this city on {date && parseDate(date).toDateString()}.</p>
              )}
              {byTheater.map(({ theater, shows }) => (
                <div key={theater.theaterId} className="card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-display text-lg font-semibold">{theater.theaterName}</h3>
                      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted"><MapPin size={14} />{theater.address || theater.city}</p>
                    </div>
                    <span className="text-xs text-faint">From {money(Math.min(...shows.map((s) => s.priceStandard)), shows[0].currency)}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {shows.map((s) => {
                      const low = s.availableSeats != null && s.availableSeats <= 10
                      const soldOut = s.availableSeats === 0
                      return (
                        <button
                          key={s.id}
                          disabled={soldOut || !s.bookable}
                          onClick={() => navigate(`/book/${s.id}`)}
                          className="group min-w-28 rounded-xl border border-line bg-surface-2 px-4 py-2.5 text-left transition hover:border-brand hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <div className="font-semibold group-hover:text-brand">{time12(s.startTime)}</div>
                          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted">
                            <span>{s.screenName}</span>
                            {s.format && <span className="rounded bg-bg px-1 font-semibold">{s.format}</span>}
                          </div>
                          <div className={`mt-1 text-[11px] font-medium ${soldOut ? "text-brand" : low ? "text-amber-400" : "text-emerald-400"}`}>
                            {soldOut ? "Sold out" : low ? `Only ${s.availableSeats} left` : `${s.availableSeats} seats free`}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {trailer && <TrailerModal url={m.trailerUrl} onClose={() => setTrailer(false)} />}
    </div>
  )
}
