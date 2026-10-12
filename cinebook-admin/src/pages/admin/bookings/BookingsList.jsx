import { useCallback, useEffect, useState } from "react"
import { Ban, Eye, Search, Ticket } from "lucide-react"
import { toast } from "sonner"
import api, { errorMessage } from "../../../api/axios"
import { ConfirmDialog, Empty, Modal, PageHeader, StatusBadge, TableSkeleton } from "../../../components/ui"
import { dateTime, money, shortDate, time12 } from "../../../lib/format"

const STATUSES = ["", "CONFIRMED", "PENDING", "CANCELLED", "REFUNDED", "EXPIRED"]

export default function BookingsList() {
  const [bookings, setBookings] = useState(null)
  const [status, setStatus] = useState("")
  const [query, setQuery] = useState("")
  const [debounced, setDebounced] = useState("")
  const [detail, setDetail] = useState(null)
  const [toCancel, setToCancel] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300)
    return () => clearTimeout(t)
  }, [query])

  const load = useCallback(() => {
    api.get("/bookings", { params: { ...(status && { status }), ...(debounced && { q: debounced }) } })
      .then((res) => setBookings(res.data))
      .catch((err) => {
        toast.error(errorMessage(err))
        setBookings([])
      })
  }, [status, debounced])

  useEffect(() => {
    load()
  }, [load])

  const cancel = async () => {
    setBusy(true)
    try {
      const res = await api.post(`/bookings/${toCancel.id}/cancel`)
      toast.success(res.data.status === "REFUNDED" ? "Booking cancelled and refunded via Stripe" : "Booking cancelled")
      setToCancel(null)
      setDetail(null)
      load()
    } catch (err) {
      toast.error(errorMessage(err, "Could not cancel booking"))
    } finally {
      setBusy(false)
    }
  }

  const revenue = (bookings || []).filter((b) => b.status === "CONFIRMED").reduce((s, b) => s + Number(b.totalAmount), 0)
  const currency = bookings?.[0]?.currency

  return (
    <div>
      <PageHeader title="Bookings" subtitle={bookings ? `${bookings.length} bookings · ${money(revenue, currency)} confirmed in this view` : "Loading..."} />

      <div className="card overflow-hidden">
        <div className="flex flex-wrap gap-2 border-b border-line p-4">
          <div className="relative min-w-60 flex-1 sm:max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <input className="input pl-9" placeholder="Reference, name, phone or show" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-1 rounded-lg bg-surface-2 p-1">
            {STATUSES.map((s) => (
              <button key={s || "all"} onClick={() => setStatus(s)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${status === s ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"}`}>
                {s ? s.charAt(0) + s.slice(1).toLowerCase() : "All"}
              </button>
            ))}
          </div>
        </div>

        {!bookings ? (
          <TableSkeleton />
        ) : bookings.length === 0 ? (
          <Empty icon={Ticket} title="No bookings found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-line bg-surface-2/60">
                <tr>
                  <th className="table-th">Reference</th>
                  <th className="table-th">Customer</th>
                  <th className="table-th">Show</th>
                  <th className="table-th">Seats</th>
                  <th className="table-th">Amount</th>
                  <th className="table-th">Status</th>
                  <th className="table-th">Created</th>
                  <th className="table-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-surface-2/40">
                    <td className="table-td font-mono text-xs font-semibold">{b.reference}</td>
                    <td className="table-td">
                      <p className="font-medium">{b.contactName || b.userName}</p>
                      <p className="text-xs text-muted">{b.contactPhone || b.userEmail}</p>
                    </td>
                    <td className="table-td">
                      <p className="font-medium">{b.showtime.movieTitle}</p>
                      <p className="text-xs text-muted">{shortDate(b.showtime.showDate)} {time12(b.showtime.startTime)} · {b.showtime.theaterName}</p>
                    </td>
                    <td className="table-td max-w-40 truncate text-muted" title={b.seatLabels}>{b.seatLabels}</td>
                    <td className="table-td font-semibold tabular-nums">{money(b.totalAmount, b.currency)}</td>
                    <td className="table-td"><StatusBadge status={b.status} /></td>
                    <td className="table-td whitespace-nowrap text-muted">{dateTime(b.createdAt)}</td>
                    <td className="table-td">
                      <div className="flex justify-end gap-1">
                        <button className="btn-icon" title="Details" onClick={() => setDetail(b)}><Eye size={17} /></button>
                        {(b.status === "CONFIRMED" || b.status === "PENDING") && (
                          <button className="btn-icon hover:text-red-600!" title="Cancel" onClick={() => setToCancel(b)}><Ban size={17} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={!!detail}
        title={`Booking ${detail?.reference || ""}`}
        onClose={() => setDetail(null)}
        footer={
          detail && (detail.status === "CONFIRMED" || detail.status === "PENDING") && (
            <button className="btn-danger" onClick={() => setToCancel(detail)}><Ban size={16} /> {detail.status === "CONFIRMED" ? "Cancel & refund" : "Cancel hold"}</button>
          )
        }
      >
        {detail && (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <Row label="Status" value={<StatusBadge status={detail.status} />} />
            <Row label="Amount" value={money(detail.totalAmount, detail.currency)} />
            <Row label="Account" value={`${detail.userName} (${detail.userEmail})`} wide />
            {detail.contactName && <Row label="Ticket holder" value={detail.contactName} />}
            {detail.contactPhone && <Row label="Mobile" value={<a className="text-brand hover:underline" href={`tel:${detail.contactPhone}`}>{detail.contactPhone}</a>} />}
            {detail.contactEmail && <Row label="Contact email" value={detail.contactEmail} wide />}
            <Row label="Movie" value={detail.showtime.movieTitle} wide />
            <Row label="Show" value={`${shortDate(detail.showtime.showDate)}, ${time12(detail.showtime.startTime)}`} />
            <Row label="Screen" value={`${detail.showtime.theaterName} · ${detail.showtime.screenName}`} />
            <Row label="Seats" value={detail.seats.map((s) => `${s.label} (${s.type.toLowerCase()})`).join(", ")} wide />
            <Row label="Created" value={dateTime(detail.createdAt)} />
            <Row label="Confirmed" value={dateTime(detail.confirmedAt)} />
            {detail.cancelledAt && <Row label="Cancelled" value={dateTime(detail.cancelledAt)} />}
            {detail.status === "PENDING" && <Row label="Hold expires" value={dateTime(detail.expiresAt)} />}
            {detail.stripePaymentIntentId && <Row label="Stripe payment" value={<code className="text-xs">{detail.stripePaymentIntentId}</code>} wide />}
            {detail.stripeRefundId && <Row label="Stripe refund" value={<code className="text-xs">{detail.stripeRefundId}</code>} wide />}
          </dl>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toCancel}
        title={toCancel?.status === "CONFIRMED" ? "Cancel and refund?" : "Cancel this hold?"}
        message={
          toCancel?.status === "CONFIRMED"
            ? `${toCancel.reference} will be cancelled, its seats released, and ${money(toCancel.totalAmount, toCancel.currency)} refunded to the customer through Stripe.`
            : `The seats held by ${toCancel?.reference} will be released immediately.`
        }
        confirmLabel={toCancel?.status === "CONFIRMED" ? "Cancel & refund" : "Cancel hold"}
        busy={busy}
        onConfirm={cancel}
        onClose={() => setToCancel(null)}
      />
    </div>
  )
}

function Row({ label, value, wide }) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  )
}
