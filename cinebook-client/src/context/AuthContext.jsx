import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { TOKEN_KEY } from "../services/api"
import { fetchMe, loginRequest, registerRequest } from "../services/authService"

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null)

const USER_KEY = "cinebook_user"

function readUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY)) || null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(readUser)

  const store = (data) => {
    localStorage.setItem(TOKEN_KEY, data.token)
    const u = { id: data.id, name: data.name, email: data.email, role: data.role }
    localStorage.setItem(USER_KEY, JSON.stringify(u))
    setToken(data.token)
    setUser(u)
    return u
  }

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  const login = async (email, password) => store(await loginRequest(email, password))
  const register = async (name, email, password) => store(await registerRequest(name, email, password))

  // Re-validate a stored token once on load; the API interceptor fires the event on 401.
  useEffect(() => {
    const onLogout = () => logout()
    window.addEventListener("cinebook:logout", onLogout)
    if (token) fetchMe().catch(() => {})
    return () => window.removeEventListener("cinebook:logout", onLogout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AuthContext.Provider value={{ token, user, isAuthed: !!token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
