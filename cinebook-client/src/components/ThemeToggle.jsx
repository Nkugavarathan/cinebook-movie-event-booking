import { Moon, Sun } from "lucide-react"
import { useTheme } from "../context/ThemeContext"

export default function ThemeToggle({ className = "" }) {
  const { theme, toggle } = useTheme()
  const dark = theme === "dark"
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className={`grid h-9 w-9 place-items-center rounded-full border border-line bg-surface-2 text-muted transition hover:text-ink ${className}`}
    >
      {dark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  )
}
