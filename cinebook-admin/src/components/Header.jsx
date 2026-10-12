import { LogOut, Menu } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function AdminHeader({ onMenu }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-surface/90 px-4 backdrop-blur sm:px-6">
      <button className="btn-icon lg:hidden" onClick={onMenu} aria-label="Open menu">
        <Menu size={20} />
      </button>
      <div className="hidden lg:block" />
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-semibold leading-tight">{user?.name}</p>
          <p className="text-xs text-muted">{user?.email}</p>
        </div>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-brand text-sm font-bold text-white">
          {(user?.name || "A").charAt(0)}
        </span>
        <button onClick={handleLogout} className="btn-icon" title="Sign out" aria-label="Sign out">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
