import { useCallback, useEffect, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { MessageSquareText, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import api, { errorMessage } from "../services/api"
import { useAuth } from "../context/AuthContext"
import { StarInput, Stars } from "./Stars"
import { ConfirmModal, Spinner } from "./ui"
import { dateTimeShort } from "../lib/format"

const PAGE = 5

/** Ratings + reviews for a movie or event (kind: "movies" | "events"). */
export default function ReviewsSection({ kind, id, title }) {
  const { isAuthed } = useAuth()
  const location = useLocation()
  const [data, setData] = useState(null)
  const [editing, setEditing] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [shown, setShown] = useState(PAGE)

  const load = useCallback(() => {
    api.get(`/${kind}/${id}/reviews`).then((res) => setData(res.data)).catch(() => setData(null))
  }, [kind, id])

  useEffect(() => {
    load()
  }, [load])

  const startEdit = () => {
    setRating(data?.myReview?.rating || 0)
    setComment(data?.myReview?.comment || "")
    setEditing(true)
  }

  const save = async (e) => {
    e.preventDefault()
    if (!rating) return toast.error("Pick a star rating")
    setSaving(true)
    try {
      await api.post("/reviews", { [kind === "movies" ? "movieId" : "eventId"]: Number(id), rating, comment })
      toast.success(data?.myReview ? "Review updated" : "Thanks for your review!")
      setEditing(false)
      load()
    } catch (err) {
      toast.error(errorMessage(err, "Could not save your review"))
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    setSaving(true)
    try {
      await api.delete(`/reviews/${data.myReview.id}`)
      toast.success("Review deleted")
      setConfirmDelete(false)
      load()
    } catch (err) {
      toast.error(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (!data) return null
  const others = data.reviews.filter((r) => !r.mine)
  const max = Math.max(1, ...data.distribution)

  return (
    <section id="reviews" className="mx-auto mt-16 max-w-7xl scroll-mt-20 px-4 sm:px-6">
      <h2 className="font-display text-2xl font-bold">Ratings & reviews</h2>

      <div className="mt-6 grid gap-8 lg:grid-cols-[300px_1fr]">
        {/* Summary */}
        <div className="card h-fit p-6">
          {data.count === 0 ? (
            <div className="text-center">
              <Stars value={0} size={22} />
              <p className="mt-2 text-sm text-muted">No reviews yet. Watched it? Be the first to rate {title}.</p>
            </div>
          ) : (
            <>
              <div className="flex items-end gap-3">
                <span className="font-display text-5xl font-bold leading-none">{data.average.toFixed(1)}</span>
                <div className="pb-1">
                  <Stars value={data.average} size={18} />
                  <p className="mt-1 text-xs text-muted">{data.count} review{data.count > 1 ? "s" : ""}</p>
                </div>
              </div>
              <div className="mt-5 space-y-1.5">
                {[5, 4, 3, 2, 1].map((n) => (
                  <div key={n} className="flex items-center gap-2 text-xs">
                    <span className="w-3 text-muted">{n}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                      <div className="h-full rounded-full bg-amber-400" style={{ width: `${(data.distribution[n - 1] / max) * 100}%` }} />
                    </div>
                    <span className="w-6 text-right tabular-nums text-faint">{data.distribution[n - 1]}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="mt-6 border-t border-line pt-5">
            {data.myReview && !editing ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-faint">Your review</p>
                <Stars value={data.myReview.rating} className="mt-1.5" />
                {data.myReview.hidden && <p className="mt-1 text-xs text-amber-400">Hidden by CineBook moderators</p>}
                <div className="mt-3 flex gap-2">
                  <button onClick={startEdit} className="btn-ghost flex-1 py-2 text-sm"><Pencil size={15} /> Edit</button>
                  <button onClick={() => setConfirmDelete(true)} className="btn-ghost py-2 text-sm" aria-label="Delete review"><Trash2 size={15} /></button>
                </div>
              </div>
            ) : data.canReview && !editing ? (
              <button onClick={startEdit} className="btn-primary w-full py-2.5">Write a review</button>
            ) : !editing ? (
              <p className="text-sm text-muted">
                {isAuthed ? data.reason : (
                  <><Link to="/login" state={{ from: location.pathname }} className="font-semibold text-brand hover:underline">Sign in</Link> to rate a show you've watched.</>
                )}
              </p>
            ) : null}
          </div>
        </div>

        {/* Form + list */}
        <div>
          {editing && (
            <form onSubmit={save} className="card mb-6 p-6">
              <p className="font-semibold">{data.myReview ? "Edit your review" : `Rate ${title}`}</p>
              <div className="mt-3"><StarInput value={rating} onChange={setRating} /></div>
              <label htmlFor="review-text" className="mt-4 block text-sm font-medium">Your thoughts <span className="font-normal text-faint">(optional)</span></label>
              <textarea id="review-text" rows={4} maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)}
                placeholder="What did you like? No spoilers please!" className="input mt-1.5 resize-y" />
              <div className="mt-1 text-right text-xs text-faint">{comment.length}/1000</div>
              <div className="mt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setEditing(false)} className="btn-ghost py-2.5">Cancel</button>
                <button disabled={saving || !rating} className="btn-primary py-2.5">{saving && <Spinner size={16} />} {data.myReview ? "Save" : "Post review"}</button>
              </div>
            </form>
          )}

          {data.myReview && !data.myReview.hidden && (
            <ReviewItem r={data.myReview} you />
          )}
          {others.length === 0 && !data.myReview && (
            <div className="card flex flex-col items-center p-10 text-center text-sm text-muted">
              <MessageSquareText size={28} className="text-faint" />
              <p className="mt-2">Reviews from people who watched it will appear here.</p>
            </div>
          )}
          <div className="space-y-3">
            {others.slice(0, shown).map((r) => <ReviewItem key={r.id} r={r} />)}
          </div>
          {others.length > shown && (
            <button onClick={() => setShown((s) => s + PAGE)} className="btn-ghost mt-4 w-full py-2.5 text-sm">
              Show more reviews ({others.length - shown})
            </button>
          )}
        </div>
      </div>

      <ConfirmModal open={confirmDelete} title="Delete your review?" confirmLabel="Delete" busy={saving}
        onConfirm={remove} onClose={() => setConfirmDelete(false)}>
        Your rating and comment will be removed.
      </ConfirmModal>
    </section>
  )
}

function ReviewItem({ r, you }) {
  return (
    <article className={`card mb-3 p-5 ${you ? "border-brand/40" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-sm font-bold">{r.userName.charAt(0)}</span>
          <div>
            <p className="text-sm font-semibold">{r.userName}{you && <span className="ml-2 rounded bg-brand-soft px-1.5 text-[10px] font-bold uppercase text-brand">You</span>}</p>
            <p className="text-xs text-faint">Watched with CineBook · {dateTimeShort(r.updatedAt || r.createdAt)}{r.updatedAt ? " (edited)" : ""}</p>
          </div>
        </div>
        <Stars value={r.rating} size={15} />
      </div>
      {r.comment && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">{r.comment}</p>}
    </article>
  )
}
