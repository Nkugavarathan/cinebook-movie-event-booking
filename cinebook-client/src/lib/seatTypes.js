import { Armchair, Crown, Sparkles } from "lucide-react"

export const SEAT_TYPES = {
  STANDARD: { label: "Standard", ring: "border-slate-500/60 hover:border-slate-300", dot: "bg-slate-400", icon: Armchair },
  PREMIUM: { label: "Premium", ring: "border-violet-500/70 hover:border-violet-300", dot: "bg-violet-500", icon: Sparkles },
  VIP: { label: "VIP Recliner", ring: "border-amber-400/80 hover:border-amber-200", dot: "bg-amber-400", icon: Crown },
}
