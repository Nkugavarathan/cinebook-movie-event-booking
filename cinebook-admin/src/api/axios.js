import axios from "axios"

// Relative by default: the Vite dev server proxies /api to Spring Boot (see vite.config.js).
export const API_URL = import.meta.env.VITE_API_URL || "/api"
export const TOKEN_KEY = "cinebook_admin_token"

/** Talks to /api/admin/* (and the public API via absolute paths like "/movies"). */
const api = axios.create({
  baseURL: `${API_URL}/admin`,
  headers: { "Content-Type": "application/json" },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status
    if ((status === 401 || status === 403) && localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY)
      window.dispatchEvent(new Event("cinebook-admin:logout"))
    }
    return Promise.reject(error)
  }
)

export const authApi = axios.create({ baseURL: `${API_URL}/auth` })

export function errorMessage(err, fallback = "Something went wrong") {
  if (!err?.response) return "Can't reach the server. Is the backend running on :8080?"
  return err.response.data?.message || fallback
}

export default api
