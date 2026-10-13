import { useEffect, useState } from "react"
import { Eye, EyeOff, MessageSquareText, Search, Star, Trash2 } from "lucide-react"
import { toast } from "sonner"
import api, { errorMessage } from "../../../api/axios"
import { ConfirmDialog, Empty, PageHeader, TableSkeleton } from "../../../components/ui"
import { dateTime } from "../../../lib/format"

function Stars({ value }) {
  return (
    <span className="inline-flex" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={14} className={i <= value ? "fill-amber-400 text-amber-400" : "text-slate-300"} />
      ))}
    </span>
  )
}

export default function ReviewsList() {
  const [reviews, setReviews] = useState(null)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("all")
  const [toDelete, setToDelete] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = () =>
    api.get("/reviews").then((res) => setReviews(res.data)).catch((err) => {
      toast.error(errorMessage(err))
      setReviews([])
    })

  useEffect(() => {
    load()
  }, [])

  const setHidden = async (r, hidden) => {
    try {
      await api.patch(`/reviews/${r.id}`, { hidden })
      toast.success(hidden ? "Review hidden from customers" : "Review visible again")
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await api.delete(`/reviews/${toDelete.id}`)
      toast.success("Review deleted")
      setToDelete(null)
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const q = query.trim().toLowerCase()
  const visible = (reviews || []).filter((r) =>
    (filter === "all" || (filter === "hidden" ? r.hidden : filter === "low" ? r.rating <= 2 : !r.hidden)) &&
    (!q || [r.listingTitle, r.userName, r.userEmail, r.comment].some((v) => v?.toLowerCase().includes(q)))
  )
  const shown = (reviews || []).filter((r) => !r.hidden)
  const avg = shown.length ? (shown.reduce((s, r) => s + r.rating, 0) / shown.length).toFixed(1) : "-"

  return (
    <div>
      <PageHeader title="Reviews" subtitle={reviews ? `${reviews.length} reviews · average ${avg} ★ across visible reviews` : "Loading..."} />

      <div className="card overflow-hidden">
        <div className="flex flex-wrap gap-2 border-b border-line p-4">
          <div className="relative min-w-60 flex-1 sm:max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <input className="input pl-9" placeholder="Search title, customer or text" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-1 rounded-lg bg-surface-2 p-1">
            {[["all", "All"], ["visible", "Visible"], ["low", "1-2 stars"], ["hidden", "Hidden"]].map(([k, l]) => (
              <button key={k} onClick={() => setFilter(k)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${filter === k ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {!reviews ? (
          <TableSkeleton />
        ) : visible.length === 0 ? (
          <Empty icon={MessageSquareText} title="No reviews" text="Customers can review a movie or event after they've attended it." />
        ) : (
          <ul className="divide-y divide-line">
            {visible.map((r) => (
              <li key={r.id} className={`flex gap-4 px-5 py-4 ${r.hidden ? "bg-surface-2/50" : ""}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Stars value={r.rating} />
                    <span className="text-sm font-semibold">{r.listingTitle}</span>
                    <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted">{r.kind === "EVENT" ? "Event" : "Movie"}</span>
                    {r.hidden && <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-700">Hidden</span>}
                  </div>
                  {r.comment ? <p className="mt-1.5 text-sm">{r.comment}</p> : <p className="mt-1.5 text-sm italic text-faint">No comment</p>}
                  <p className="mt-1.5 text-xs text-muted">{r.userName} · {r.userEmail} · {dateTime(r.updatedAt || r.createdAt)}{r.updatedAt ? " (edited)" : ""}</p>
                </div>
                <div className="flex shrink-0 items-start gap-0.5">
                  {r.hidden ? (
                    <button className="btn-icon hover:text-emerald-600!" title="Show again" onClick={() => setHidden(r, false)}><Eye size={17} /></button>
                  ) : (
                    <button className="btn-icon hover:text-amber-600!" title="Hide from customers" onClick={() => setHidden(r, true)}><EyeOff size={17} /></button>
                  )}
                  <button className="btn-icon hover:text-red-600!" title="Delete" onClick={() => setToDelete(r)}><Trash2 size={17} /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete review?"
        message={`The review by ${toDelete?.userName} for ${toDelete?.listingTitle} will be deleted permanently. Hiding it is usually better.`}
        busy={busy}
        onConfirm={remove}
        onClose={() => setToDelete(null)}
      />
    </div>
  )
}
