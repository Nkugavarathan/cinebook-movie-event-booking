import { Toaster } from "sonner"
import { useTheme } from "../context/ThemeContext"

export default function ThemedToaster() {
  const { theme } = useTheme()
  return <Toaster theme={theme} position="top-center" richColors closeButton />
}
