import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { CircleSlash } from "lucide-react"
import { toast } from "sonner"
import api, { errorMessage } from "../services/api"
import { Spinner } from "../components/ui"

export default function PaymentCancel() {
  const [params] = useSearchParams()
  const bookingId = params.get("booking")
  const navigate = useNavigate()
  const [releasing, setReleasing] = useState(false)

  const release = async () => {
    setReleasing(true)
    try {
      const res = await api.post(`/bookings/${bookingId}/cancel`)
      toast.success("Your seats were released")
      navigate(`/movies/${res.data.showtime.movieId}`, { replace: true })
    } catch (err) {
      toast.error(errorMessage(err))
      navigate("/bookings")
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <span className="grid h-20 w-20 place-items-center rounded-full bg-surface-2 text-muted">
        <CircleSlash size={38} />
      </span>
      <h1 className="mt-6 font-display text-3xl font-bold">Payment cancelled</h1>
      <p className="mt-3 text-muted">
        No money was taken. Your seats are still held for a few more minutes if you'd like to try again.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {bookingId && <Link to={`/checkout/${bookingId}`} className="btn-primary">Try payment again</Link>}
        {bookingId && (
          <button onClick={release} disabled={releasing} className="btn-ghost">
            {releasing && <Spinner size={16} />} Release my seats
          </button>
        )}
      </div>
    </div>
  )
}
