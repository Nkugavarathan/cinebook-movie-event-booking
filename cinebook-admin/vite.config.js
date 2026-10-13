import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import basicSsl from "@vitejs/plugin-basic-ssl"

// The admin is served under /admin/ so the customer site's dev server (5173) can forward
// http://localhost:5173/admin/* here - one address for both apps. Opening :5174 directly also works.
// `npm run dev`       -> http://localhost:5174/admin/login
// `npm run dev:phone` -> https://<your-PC-IP>:5174/admin/login on the local network. Phones only allow the
//                        camera (QR check-in scanner) on HTTPS pages, so this mode adds a self-signed cert.
// API calls go to /api and are proxied to Spring Boot, so the phone never talks to localhost:8080 directly.
export default defineConfig(({ mode }) => ({
  base: "/admin/",
  plugins: [react(), tailwindcss(), ...(mode === "phone" ? [basicSsl()] : [])],
  server: {
    port: 5174,
    strictPort: true,
    host: mode === "phone" ? true : undefined,
    proxy: {
      "/api": { target: "http://localhost:8080", changeOrigin: true },
    },
  },
}))
