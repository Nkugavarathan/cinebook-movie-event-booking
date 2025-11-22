import { createContext, useState, useEffect } from "react"

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token") || null)

  const login = (jwtToken) => {
    localStorage.setItem("token", jwtToken)
    setToken(jwtToken)
  }

  const logout = () => {
    localStorage.removeItem("token")
    window.location.href = "/login"
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
