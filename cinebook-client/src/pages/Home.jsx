import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Armchair, ArrowRight, Clock, CreditCard, MapPin, Play, QrCode, Ticket } from "lucide-react"
import { toast } from "sonner"
import api, { errorMessage } from "../services/api"
import MovieGrid from "../components/MovieGrid"
import EventCard from "../components/EventCard"
import Poster from "../components/Poster"
import TrailerModal from "../components/TrailerModal"
import { runtime } from "../lib/format"

export default function Home() {
  const [movies, setMovies] = useState([])
  const [theaters, setTheaters] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [heroIndex, setHeroIndex] = useState(0)
  const [trailer, setTrailer] = useState(null)

  useEffect(() => {
    Promise.all([api.get("/movies"), api.get("/theaters"), api.get("/events")])
      .then(([m, t, e]) => {
        setMovies(m.data)
        setTheaters(t.data)
        setEvents(e.data)
      })
      .catch((err) => toast.error(errorMessage(err, "Could not load movies")))
      .finally(() => setLoading(false))
  }, [])

  const featured = movies.filter((m) => m.upcomingShows > 0).slice(0, 5)
  const hero = featured[heroIndex] || movies[0]

  useEffect(() => {
    if (featured.length < 2) return
    const t = setInterval(() => setHeroIndex((i) => (i + 1) % featured.length), 7000)
    return () => clearInterval(t)
  }, [featured.length])

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        {hero ? (
          <div key={hero.id} className="absolute inset-0 animate-[fadeIn_.8s_ease]">
            <img src={hero.backdropUrl || hero.posterUrl} alt="" className="h-full w-full scale-110 object-cover opacity-40 blur-2xl" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-brand/20 to-bg" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-bg via-bg/70 to-bg/30" />
        <div className="absolute inset-0 bg-linear-to-r from-bg via-bg/40 to-transparent" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1fr_auto] md:py-24">
          {loading ? (
            <div className="space-y-4">
              <div className="skeleton h-6 w-40" />
              <div className="skeleton h-16 w-3/4" />
              <div className="skeleton h-20 w-full max-w-xl" />
            </div>
          ) : hero ? (
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand-soft px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" /> Now showing
              </span>
              <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">{hero.title}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
                {hero.certificate && <span className="rounded border border-line px-1.5 py-0.5 text-xs font-bold text-ink">{hero.certificate}</span>}
                <span>{hero.genre}</span>
                {hero.duration > 0 && <span className="flex items-center gap-1"><Clock size={14} />{runtime(hero.duration)}</span>}
                {hero.language && <span>{hero.language}</span>}
              </div>
              <p className="mt-5 line-clamp-3 max-w-xl text-base text-muted sm:text-lg">{hero.description}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to={`/movies/${hero.id}`} className="btn-primary px-7">
                  <Ticket size={18} /> Book tickets
                </Link>
                {hero.trailerUrl && (
                  <button onClick={() => setTrailer(hero.trailerUrl)} className="btn-ghost px-6">
                    <Play size={18} /> Watch trailer
                  </button>
                )}
              </div>
              {featured.length > 1 && (
                <div className="mt-10 flex gap-2">
                  {featured.map((m, i) => (
                    <button
                      key={m.id}
                      onClick={() => setHeroIndex(i)}
                      aria-label={`Show ${m.title}`}
                      className={`h-1.5 rounded-full transition-all ${i === heroIndex ? "w-10 bg-brand" : "w-5 bg-line hover:bg-faint"}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-2xl">
              <h1 className="font-display text-5xl font-extrabold tracking-tight">Movies, booked in seconds.</h1>
              <p className="mt-4 text-lg text-muted">No movies are showing yet. Check back soon!</p>
            </div>
          )}

          {hero && (
            <Link to={`/movies/${hero.id}`} className="hidden w-64 rotate-2 overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/60 transition hover:rotate-0 md:block lg:w-72">
              <Poster src={hero.posterUrl} title={hero.title} className="aspect-2/3 w-full" />
            </Link>
          )}
        </div>
      </section>

      {/* Movies */}
      <section id="now-showing" className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <div className="mb-6">
          <h2 className="font-display text-3xl font-bold tracking-tight">Now showing</h2>
          <p className="mt-1 text-muted">Pick a movie, choose your seats, and you're in.</p>
        </div>
        <MovieGrid movies={movies} loading={loading} />
      </section>

      {/* Events */}
      {events.length > 0 && (
        <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight">Upcoming events</h2>
              <p className="mt-1 text-muted">Concerts, comedy, theatre and more — with reserved seating.</p>
            </div>
            <Link to="/events" className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-brand hover:underline sm:flex">
              View all <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {events.slice(0, 4).map((e) => <EventCard key={e.id} event={e} />)}
          </div>
          <Link to="/events" className="btn-ghost mt-6 w-full sm:hidden">View all events</Link>
        </section>
      )}

      {/* How it works */}
      <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            [Armchair, "Choose your seat", "See the live seat map and pick exactly where you want to sit. Seats are held for you while you pay."],
            [CreditCard, "Pay securely", "Checkout is handled by Stripe. We never see or store your card details."],
            [QrCode, "Show your QR ticket", "Your e-ticket arrives instantly. Show the QR code at the entrance and enjoy the show."],
          ].map(([Icon, title, text], i) => (
            <div key={title} className="card relative overflow-hidden p-6">
              <span className="absolute right-5 top-4 font-display text-6xl font-extrabold text-surface-2">{i + 1}</span>
              <span className="relative grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand">
                <Icon size={22} />
              </span>
              <h3 className="relative mt-4 font-display text-lg font-semibold">{title}</h3>
              <p className="relative mt-1 text-sm text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Theaters */}
      {theaters.length > 0 && (
        <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6">
          <h2 className="font-display text-3xl font-bold tracking-tight">Our cinemas</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {theaters.map((t) => (
              <div key={t.id} className="card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-lg font-semibold">{t.name}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted"><MapPin size={14} />{t.address || t.city}</p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-surface-2 px-2.5 py-1 text-xs font-semibold text-muted">{t.city}</span>
                </div>
                {t.facilities && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {t.facilities.split(",").map((f) => f.trim()).filter(Boolean).map((f) => (
                      <span key={f} className="rounded-md border border-line px-2 py-0.5 text-xs text-muted">{f}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {trailer && <TrailerModal url={trailer} onClose={() => setTrailer(null)} />}
    </div>
  )
}
