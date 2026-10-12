import { ImageIcon } from "lucide-react"

/** Shimmering block; pass sizing classes. */
export function Bone({ className = "" }) {
  return <div className={`skeleton ${className}`} aria-hidden />
}

/** Image placeholder with a faint picture icon in the middle. */
export function ImageBone({ className = "" }) {
  return (
    <div className={`skeleton grid place-items-center ${className}`} aria-hidden>
      <ImageIcon className="relative text-faint/50" size={36} strokeWidth={1.5} />
    </div>
  )
}

/** Wraps skeleton content so screen readers announce a single "Loading" state. */
function Loading({ label, children, className = "" }) {
  return (
    <div role="status" aria-label={label} className={className}>
      {children}
      <span className="sr-only">{label}</span>
    </div>
  )
}

export function MovieCardSkeleton() {
  return (
    <div>
      <ImageBone className="aspect-2/3 rounded-2xl" />
      <Bone className="mt-3 h-5 w-3/4" />
      <Bone className="mt-2 h-3 w-1/2" />
    </div>
  )
}

export function EventCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <ImageBone className="aspect-4/3 rounded-none" />
      <div className="space-y-2.5 p-4">
        <Bone className="h-5 w-4/5" />
        <Bone className="h-3.5 w-1/2" />
        <Bone className="h-3 w-2/3" />
        <div className="flex items-center justify-between pt-3">
          <Bone className="h-4 w-20" />
          <Bone className="h-7 w-20 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

/** Movie / event detail page: hero + list of dates. */
export function DetailSkeleton({ wideImage = false }) {
  return (
    <Loading label="Loading details" className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6">
      <Bone className="mb-6 h-4 w-16" />
      <div className={`grid gap-8 ${wideImage ? "md:grid-cols-[1.1fr_1fr]" : "md:grid-cols-[260px_1fr]"} md:items-end`}>
        <ImageBone className={`mx-auto w-48 rounded-2xl md:mx-0 md:w-full ${wideImage ? "aspect-16/10 w-full" : "aspect-2/3"}`} />
        <div className="space-y-4">
          <div className="flex gap-2"><Bone className="h-6 w-14 rounded-full" /><Bone className="h-6 w-20 rounded-full" /></div>
          <Bone className="h-12 w-3/4" />
          <div className="flex gap-4"><Bone className="h-4 w-20" /><Bone className="h-4 w-20" /><Bone className="h-4 w-32" /></div>
          <Bone className="h-4 w-full max-w-2xl" />
          <Bone className="h-4 w-5/6 max-w-xl" />
          <div className="flex gap-3 pt-3"><Bone className="h-12 w-36" /><Bone className="h-12 w-28" /></div>
        </div>
      </div>
      <Bone className="mt-14 h-7 w-40" />
      <div className="mt-5 flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => <Bone key={i} className="h-20 w-20 shrink-0 rounded-2xl" />)}
      </div>
      <div className="mt-5 space-y-4">
        {[0, 1].map((i) => (
          <div key={i} className="card space-y-4 p-5">
            <Bone className="h-5 w-48" />
            <Bone className="h-3.5 w-64" />
            <div className="flex gap-3">{[0, 1, 2].map((j) => <Bone key={j} className="h-16 w-28" />)}</div>
          </div>
        ))}
      </div>
    </Loading>
  )
}

export function SeatMapSkeleton() {
  return (
    <Loading label="Loading seat map">
      <div className="border-b border-line">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6">
          <Bone className="h-9 w-9" />
          <ImageBone className="hidden h-16 w-11 rounded-lg sm:grid [&>svg]:hidden" />
          <div className="space-y-2"><Bone className="h-5 w-56" /><Bone className="h-3.5 w-80 max-w-[60vw]" /></div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mt-6 flex justify-center gap-4">{[0, 1, 2, 3].map((i) => <Bone key={i} className="h-4 w-24" />)}</div>
        <div className="card mt-6 flex flex-col items-center gap-2 px-4 py-8">
          <Bone className="mb-8 h-2 w-2/3 rounded-full" />
          {Array.from({ length: 8 }).map((_, r) => (
            <div key={r} className="flex gap-1.5">
              {Array.from({ length: 14 }).map((_, c) => <Bone key={c} className="h-7 w-7 rounded-t-lg rounded-b-sm sm:h-8 sm:w-8" />)}
            </div>
          ))}
        </div>
      </div>
    </Loading>
  )
}

export function BookingListSkeleton() {
  return (
    <Loading label="Loading your tickets" className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Bone className="h-10 w-56" />
      <Bone className="mt-6 h-11 w-80 max-w-full" />
      <div className="mt-6 space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card flex items-center gap-4 p-4">
            <ImageBone className="h-24 w-16 shrink-0 rounded-lg [&>svg]:h-5 [&>svg]:w-5" />
            <div className="flex-1 space-y-2">
              <Bone className="h-5 w-1/2" />
              <Bone className="h-3.5 w-2/3" />
              <Bone className="h-3.5 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </Loading>
  )
}

export function CheckoutSkeleton() {
  return (
    <Loading label="Loading checkout" className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Bone className="h-4 w-32" />
      <Bone className="mt-2 h-9 w-56" />
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="card p-6">
          <div className="flex gap-4">
            <ImageBone className="h-28 w-20 shrink-0 rounded-xl [&>svg]:h-5 [&>svg]:w-5" />
            <div className="flex-1 space-y-2.5"><Bone className="h-6 w-2/3" /><Bone className="h-3.5 w-1/2" /><Bone className="h-3.5 w-1/3" /></div>
          </div>
          <div className="mt-8 space-y-3"><Bone className="h-4 w-full" /><Bone className="h-4 w-4/5" /><Bone className="mt-6 h-8 w-full" /></div>
        </div>
        <div className="card space-y-3 p-6"><Bone className="h-5 w-24" /><Bone className="h-4 w-full" /><Bone className="mt-4 h-12 w-full" /></div>
      </div>
    </Loading>
  )
}

export function TicketSkeleton() {
  return (
    <Loading label="Loading ticket" className="mx-auto max-w-md px-4 py-10">
      <Bone className="mb-6 h-4 w-24" />
      <div className="card overflow-hidden rounded-3xl">
        <ImageBone className="h-40 rounded-none" />
        <div className="grid grid-cols-2 gap-4 p-5">
          {[0, 1, 2, 3].map((i) => <div key={i} className="space-y-1.5"><Bone className="h-3 w-12" /><Bone className="h-4 w-24" /></div>)}
        </div>
        <div className="flex flex-col items-center gap-3 px-5 pb-6 pt-2">
          <Bone className="h-48 w-48 rounded-2xl" />
          <Bone className="h-5 w-32" />
        </div>
      </div>
    </Loading>
  )
}
