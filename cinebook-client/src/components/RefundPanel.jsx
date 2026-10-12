import { useState } from "react"
import { CalendarClock, CircleCheck, RotateCcw, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import api, { errorMessage } from "../services/api"
import { ConfirmModal } from "./ui"
import { dateTimeShort, money, parseDateTime, showStartsAt } from "../lib/format"

/**
 * Lets a customer cancel a paid ticket and get their money back until the refund deadline
 * (24 hours before the show by default). Shows the refund result afterwards.
 */
export default function RefundPanel({ booking, onChange }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const b = booking

  if (b.status === "REFUNDED") {
    return (
      <div className="card no-print mt-6 flex gap-3 border-sky-500/30 p-5">
        <CircleCheck className="mt-0.5 shrink-0 text-sky-400" size={22} />
        <div className="text-sm">
          <p className="font-semibold">{money(b.refundAmount ?? b.totalAmount, b.currency)} refunded</p>
          <p className="mt-1 text-muted">
            {b.cancelledBy === "CUSTOMER" ? "You cancelled this booking" : "This booking was cancelled"}
            {b.cancelledAt ? ` on ${dateTimeShort(b.cancelledAt)}` : ""}. The money goes back to the card you paid with
            and usually shows up within 5-10 business days.
          </p>
        </div>
      </div>
    )
  }

  if (b.status !== "CONFIRMED" || showStartsAt(b.showtime) < new Date()) return null

  const deadline = b.refundDeadline ? parseDateTime(b.refundDeadline) : null
  const full = b.refundAmount != null && Number(b.refundAmount) >= Number(b.totalAmount)

  if (!b.refundable) {
    return (
      <div className="card no-print mt-6 flex gap-3 p-5 text-sm">
        <CalendarClock className="mt-0.5 shrink-0 text-faint" size={20} />
        <p className="text-muted">
          Cancellation closed{deadline ? ` on ${dateTimeShort(b.refundDeadline)}` : ""} - tickets can be refunded until
          24 hours before the show. Enjoy the movie!
        </p>
      </div>
    )
  }

  const cancel = async () => {
    setBusy(true)
    try {
      const res = await api.post(`/bookings/${b.id}/refund`)
      toast.success(`Booking cancelled. ${money(res.data.refundAmount, res.data.currency)} is on its way back to you.`)
      setOpen(false)
      onChange(res.data)
    } catch (err) {
      toast.error(errorMessage(err, "Could not cancel this booking"))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="no-print mt-6 overflow-hidden rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
        <div className="flex gap-3 p-5">
          <ShieldCheck className="mt-0.5 shrink-0 text-emerald-400" size={22} />
          <div className="text-sm">
            <p className="font-semibold">Can't make it? {full ? "Free cancellation" : "Cancel and get a refund"}</p>
            <p className="mt-1 text-muted">
              Cancel until <span className="font-semibold text-ink">{dateTimeShort(b.refundDeadline)}</span> and get{" "}
              <span className="font-semibold text-ink">{money(b.refundAmount, b.currency)}</span>{full ? " - the full amount -" : ""} back
              to your card.
            </p>
          </div>
        </div>
        <button onClick={() => setOpen(true)}
          className="flex w-full items-center justify-center gap-2 border-t border-emerald-500/20 py-3 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/10">
          <RotateCcw size={16} /> Cancel booking & get refund
        </button>
      </div>

      <ConfirmModal
        open={open}
        title="Cancel this booking?"
        confirmLabel={`Cancel & refund ${money(b.refundAmount, b.currency)}`}
        busy={busy}
        onConfirm={cancel}
        onClose={() => setOpen(false)}
      >
        <p>
          Your seats <span className="font-semibold text-ink">{b.seatLabels}</span> for{" "}
          <span className="font-semibold text-ink">{b.showtime.movieTitle}</span> will be released and this ticket will stop working.
        </p>
        <p className="mt-3">
          We'll refund <span className="font-semibold text-ink">{money(b.refundAmount, b.currency)}</span> to the card you paid with.
          Banks usually take 5-10 business days to show it. This can't be undone.
        </p>
      </ConfirmModal>
    </>
  )
}
