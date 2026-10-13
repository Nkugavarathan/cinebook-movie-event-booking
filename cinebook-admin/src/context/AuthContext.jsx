import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { authApi, TOKEN_KEY } from "../api/axios"

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null)

const USER_KEY = "cinebook_admin_user"

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY))
    } catch {
      return null
    }
  })

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  /** ADMIN accounts get the full dashboard; STAFF only the check-in scanner. The server enforces the same rules. */
  const login = async (email, password) => {
    const { data } = await authApi.post("/login", { email, password })
    if (data.role !== "ADMIN" && data.role !== "STAFF") {
      const err = new Error("This account does not have admin access.")
      err.response = { data: { message: err.message } }
      throw err
    }
    localStorage.setItem(TOKEN_KEY, data.token)
    const u = { name: data.name, email: data.email, role: data.role }
    localStorage.setItem(USER_KEY, JSON.stringify(u))
    setToken(data.token)
    setUser(u)
    return u
  }

  useEffect(() => {
    window.addEventListener("cinebook-admin:logout", logout)
    return () => window.removeEventListener("cinebook-admin:logout", logout)
  }, [logout])

  return <AuthContext.Provider value={{ token, user, login, logout }}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
