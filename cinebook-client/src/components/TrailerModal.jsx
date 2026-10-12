import { useEffect } from "react"
import { X } from "lucide-react"
import { youtubeId } from "../lib/format"

export default function TrailerModal({ url, onClose }) {
  const id = youtubeId(url)

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur" onClick={onClose}>
      <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-11 right-0 rounded-full p-2 text-muted hover:text-ink" aria-label="Close trailer">
          <X size={24} />
        </button>
        <div className="aspect-video overflow-hidden rounded-2xl border border-line bg-black shadow-2xl">
          {id ? (
            <iframe
              className="h-full w-full"
              src={`https://www.youtube.com/embed/${id}?autoplay=1&rel=0`}
              title="Trailer"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video className="h-full w-full" src={url} controls autoPlay />
          )}
        </div>
      </div>
    </div>
  )
}
