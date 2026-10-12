import { useState } from "react"
import { Film } from "lucide-react"

/** Movie poster with a graceful placeholder when the image is missing or broken. */
export default function Poster({ src, title, className = "", eager = false }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 bg-linear-to-br from-surface-2 to-bg p-4 text-center ${className}`}>
        <Film className="text-faint" size={32} />
        <span className="font-display text-sm font-semibold text-muted">{title}</span>
      </div>
    )
  }
  return <img src={src} alt={title} loading={eager ? "eager" : "lazy"} onError={() => setFailed(true)} className={`object-cover ${className}`} />
}
