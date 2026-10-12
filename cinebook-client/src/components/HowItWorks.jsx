import { Link } from "react-router-dom"
import { QRCodeSVG } from "qrcode.react"
import { Armchair, CreditCard, Lock, QrCode, Ticket } from "lucide-react"

/* Seat states for the little demo map: s = selected, x = sold, . = free, _ = aisle */
const DEMO_SEATS = ["..._...", "..x_x..", "..._ss.", "xx._..."]

function SeatsPreview() {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="mb-2 h-1 w-3/4 rounded-full bg-linear-to-r from-transparent via-brand to-transparent" />
      {DEMO_SEATS.map((row, r) => (
        <div key={r} className="flex gap-1.5">
          {[...row].map((c, i) =>
            c === "_" ? (
              <span key={i} className="w-3" />
            ) : (
              <span
                key={i}
                className={`h-4 w-4 rounded-t-[5px] rounded-b-[2px] border ${
                  c === "s"
                    ? "border-brand bg-brand shadow-md shadow-brand/40"
                    : c === "x"
                      ? "border-transparent bg-zinc-800"
                      : "border-muted/40 bg-surface"
                }`}
              />
            )
          )}
        </div>
      ))}
      <span className="mt-2 rounded-full bg-brand-soft px-2.5 py-0.5 text-[10px] font-semibold text-brand">C5, C6 selected</span>
    </div>
  )
}

function PaymentPreview() {
  return (
    <div className="w-48 rounded-xl border border-line bg-surface p-3 shadow-lg shadow-black/10">
      <div className="flex items-center justify-between text-[10px] text-muted">
        <span>Card</span>
        <span className="flex gap-0.5">
          <span className="h-3 w-4 rounded-sm bg-amber-400/80" />
          <span className="h-3 w-4 rounded-sm bg-brand/80" />
        </span>
      </div>
      <div className="mt-1.5 rounded-md border border-line bg-surface-2 px-2 py-1.5 font-mono text-[11px] tracking-widest">
        •••• 4242
      </div>
      <div className="mt-2.5 rounded-md bg-brand py-1.5 text-center text-[11px] font-semibold text-white">Pay now</div>
      <p className="mt-2 flex items-center justify-center gap-1 text-[9px] text-faint"><Lock size={9} /> Secured by Stripe</p>
    </div>
  )
}

function TicketPreview() {
  return (
    <div className="relative flex w-48 items-center gap-3 rounded-xl bg-white p-3 text-zinc-900 shadow-lg shadow-black/20">
      <span className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-surface-2" />
      <span className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-surface-2" />
      <QRCodeSVG value="CINEBOOK:CB-7K2P9QX" size={56} level="L" />
      <div className="min-w-0">
        <p className="text-[9px] font-semibold uppercase tracking-wider text-brand">Admit 2</p>
        <p className="truncate text-xs font-bold">Dune: Part Two</p>
        <p className="text-[10px] text-zinc-500">Seats C5, C6</p>
        <p className="mt-1 font-mono text-[9px] font-bold tracking-wider">CB-7K2P9QX</p>
      </div>
    </div>
  )
}

const STEPS = [
  { icon: Armchair, title: "Choose your seat", text: "Pick a show and tap the exact seats you want on the live seat map. They're held for you while you pay.", preview: SeatsPreview },
  { icon: CreditCard, title: "Pay securely", text: "Check out on Stripe with card, Apple Pay or Google Pay. We never see or store your card details.", preview: PaymentPreview },
  { icon: QrCode, title: "Show your QR ticket", text: "Your e-ticket arrives instantly in My Tickets. Scan the QR at the entrance and enjoy the show.", preview: TicketPreview },
]

export default function HowItWorks() {
  return (
    <section className="relative mx-auto mt-28 max-w-7xl px-4 sm:px-6">
      <div className="pointer-events-none absolute inset-x-0 -top-10 mx-auto h-64 max-w-3xl rounded-full bg-brand/10 blur-3xl" />

      <div className="relative mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand-soft px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand">
          <Ticket size={13} /> How it works
        </span>
        <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">Your seat in three easy steps</h2>
        <p className="mt-3 text-muted">From browsing to the big screen in under a minute.</p>
      </div>

      <div className="relative mt-14 grid gap-6 md:grid-cols-3 md:gap-8">
        {/* connector line behind the step numbers */}
        <div className="absolute left-[16.6%] right-[16.6%] top-6 hidden h-px bg-linear-to-r from-brand/0 via-brand/50 to-brand/0 md:block" />

        {STEPS.map(({ icon: Icon, title, text, preview: Preview }, i) => (
          <div key={title} className="group relative flex flex-col items-center text-center">
            <span className="relative z-10 grid h-12 w-12 place-items-center rounded-full bg-linear-to-br from-brand to-amber-500 font-display text-lg font-bold text-white shadow-lg shadow-brand/40 ring-8 ring-bg transition group-hover:scale-110">
              {i + 1}
            </span>

            <div className="card mt-6 flex w-full flex-1 flex-col overflow-hidden rounded-3xl transition duration-300 group-hover:-translate-y-1.5 group-hover:border-brand/40 group-hover:shadow-2xl group-hover:shadow-brand/10">
              <div className="relative grid h-44 place-items-center overflow-hidden bg-surface-2">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,var(--color-brand-soft),transparent_70%)]" />
                <div className="relative transition duration-500 group-hover:scale-105">
                  <Preview />
                </div>
              </div>
              <div className="flex flex-1 flex-col items-center p-6">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand">
                  <Icon size={20} />
                </span>
                <h3 className="mt-3 font-display text-lg font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="relative mt-10 flex justify-center">
        <Link to="/movies" className="btn-primary px-7"><Ticket size={18} /> Start booking</Link>
      </div>
    </section>
  )
}
