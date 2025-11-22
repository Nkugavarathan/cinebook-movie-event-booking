import api from "./api"

export const login = async (email, password) => {
  const res = await api.post("/auth/login", { email, password })
  localStorage.setItem("token", res.data.token)
  localStorage.setItem("username", res.data.name)
  localStorage.setItem("role", res.data.role)

  return res.data
}

export const register = async (name, email, password) => {
  const res = await api.post("/auth/register", { name, email, password })
  return res.data
}

export const logout = () => {
  localStorage.removeItem("token")
  localStorage.removeItem("role")
  localStorage.removeItem("username")
}
