import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

/** Password field with a show / hide toggle. Accepts the same props as <input>. */
export default function PasswordInput({ className = "", ...props }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <input {...props} type={visible ? "text" : "password"} className={`${className} pr-12`} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        onMouseDown={(e) => e.preventDefault()} // keep focus (and the caret) in the field
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        title={visible ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-xl text-faint transition hover:text-ink focus-visible:text-ink focus-visible:outline-none"
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  )
}
