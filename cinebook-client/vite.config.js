import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // The admin app (cinebook-admin, port 5174) is reachable at http://localhost:5173/admin/login.
      // ws: true keeps the admin's live reload working through this proxy.
      "^/admin(/|$)": { target: "http://localhost:5174", changeOrigin: true, ws: true },
      // The admin calls /api on its own origin; forward it to Spring Boot.
      "/api": { target: "http://localhost:8080", changeOrigin: true },
    },
  },
})
