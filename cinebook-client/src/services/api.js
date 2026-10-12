import axios from "axios"

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api"
export const TOKEN_KEY = "cinebook_token"

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// An expired/invalid token: forget it so the app falls back to signed-out state.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY)
      window.dispatchEvent(new Event("cinebook:logout"))
    }
    return Promise.reject(error)
  }
)

export function errorMessage(err, fallback = "Something went wrong") {
  if (!err?.response) return "Can't reach the server. Is the backend running?"
  return err.response.data?.message || fallback
}

export default api
