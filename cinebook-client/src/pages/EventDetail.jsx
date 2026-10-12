import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, CalendarX, Clock, Globe, MapPin, PartyPopper, ShieldCheck, Ticket, User } from "lucide-react"
import api, { errorMessage } from "../services/api"
import Poster from "../components/Poster"
import { DetailSkeleton } from "../components/Skeletons"
import { EmptyState } from "../components/ui"
import { dayChip, longDate, money, runtime, time12 } from "../lib/format"

export default function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get(`/events/${id}`)
      .then((res) => setData(res.data))
      .catch((err) => setError(errorMessage(err, "Event not found")))
  }, [id])

  const byDate = useMemo(() => {
    const groups = new Map()
    ;(data?.showtimes || []).forEach((s) => {
      if (!groups.has(s.showDate)) groups.set(s.showDate, [])
      groups.get(s.showDate).push(s)
    })
    return [...groups.entries()]
  }, [data])

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <EmptyState icon={PartyPopper} title="Event not found" text={error} action={<Link to="/events" className="btn-primary">Browse events</Link>} />
      </div>
    )
  }
  if (!data) return <DetailSkeleton wideImage />

  const e = data.event

  return (
    <div>
      <section className="relative overflow-hidden">
        <img src={e.bannerUrl || e.posterUrl} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-30 blur-2xl" />
        <div className="absolute inset-0 bg-linear-to-t from-bg via-bg/80 to-bg/40" />
        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6">
          <button onClick={() => navigate(-1)} className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
            <ArrowLeft size={16} /> Back
          </button>
          <div className="grid items-end gap-8 md:grid-cols-[1.1fr_1fr]">
            <div className="overflow-hidden rounded-2xl border border-line shadow-2xl shadow-black/30">
              <Poster src={e.bannerUrl || e.posterUrl} title={e.name} className="aspect-16/10 w-full" />
            </div>
            <div>
              <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand">{e.category}</span>
              <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">{e.name}</h1>
              {e.performer && <p className="mt-2 flex items-center gap-2 text-lg text-muted"><User size={18} />{e.performer}</p>}
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
                {e.duration > 0 && <span className="flex items-center gap-1.5"><Clock size={15} />{runtime(e.duration)}</span>}
                {e.language && <span className="flex items-center gap-1.5"><Globe size={15} />{e.language}</span>}
                {e.ageLimit && <span className="flex items-center gap-1.5"><ShieldCheck size={15} />{e.ageLimit}</span>}
                {e.venues && <span className="flex items-center gap-1.5"><MapPin size={15} />{e.venues}</span>}
              </div>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <a href="#dates" className="btn-primary px-7"><Ticket size={18} /> Book tickets</a>
                {e.fromPrice != null && <span className="text-sm text-muted">From <span className="font-semibold text-ink">{money(e.fromPrice, e.currency)}</span></span>}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <h2 className="font-display text-2xl font-bold">About the event</h2>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-muted">{e.description || "Details coming soon."}</p>
        </div>

        <div id="dates" className="scroll-mt-20">
          <h2 className="font-display text-2xl font-bold">Choose a date</h2>
          {byDate.length === 0 ? (
            <div className="mt-4">
              <EmptyState icon={CalendarX} title="No upcoming dates" text="New dates will be announced soon." />
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {byDate.map(([date, shows]) => {
                const c = dayChip(date)
                return (
                  <div key={date} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                    <div className="flex w-16 shrink-0 flex-col items-center rounded-xl bg-surface-2 py-2">
                      <span className="text-xs font-semibold uppercase text-brand">{c.month}</span>
                      <span className="font-display text-2xl font-bold leading-none">{c.day}</span>
                      <span className="text-[11px] text-muted">{c.top}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{longDate(date)}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-muted"><MapPin size={12} />{shows[0].theaterName}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {shows.map((s) => {
                        const soldOut = s.availableSeats === 0
                        const low = s.availableSeats != null && s.availableSeats <= 15
                        return (
                          <button
                            key={s.id}
                            disabled={soldOut || !s.bookable}
                            onClick={() => navigate(`/book/${s.id}`)}
                            className="group rounded-xl border border-line bg-surface-2 px-4 py-2 text-left transition hover:border-brand hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <span className="block font-semibold group-hover:text-brand">{time12(s.startTime)}</span>
                            <span className="block text-[11px] text-muted">{s.screenName} · {money(s.priceStandard, s.currency)}+</span>
                            <span className={`block text-[11px] font-medium ${soldOut ? "text-brand" : low ? "text-amber-400" : "text-emerald-400"}`}>
                              {soldOut ? "Sold out" : low ? `Only ${s.availableSeats} left` : `${s.availableSeats} seats`}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
