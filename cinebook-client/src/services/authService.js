import api from "./api"

export const loginRequest = async (email, password) => {
  const res = await api.post("/auth/login", { email, password })
  return res.data
}

export const registerRequest = async (name, email, password) => {
  const res = await api.post("/auth/signup", { name, email, password })
  return res.data
}

export const fetchMe = async () => {
  const res = await api.get("/auth/me")
  return res.data
}
