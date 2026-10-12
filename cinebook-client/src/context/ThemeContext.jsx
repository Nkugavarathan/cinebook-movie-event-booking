import { createContext, useContext, useEffect, useState } from "react"

const ThemeContext = createContext({ theme: "dark", toggle: () => {} })
const KEY = "cinebook_theme"

/** Light/dark theme stored per browser. index.html applies it before first paint. */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || "dark")

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem(KEY, theme)
    } catch {
      /* private mode: theme just won't persist */
    }
  }, [theme])

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"))

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext)
