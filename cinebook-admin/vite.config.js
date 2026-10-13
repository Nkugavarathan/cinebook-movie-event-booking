import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import basicSsl from "@vitejs/plugin-basic-ssl"

// `npm run dev`       -> http://localhost:5174
// `npm run dev:phone` -> https://<your-PC-IP>:5174 on the local network. Phones only allow the
//                        camera (QR check-in scanner) on HTTPS pages, so this mode adds a self-signed cert.
// API calls go to /api and are proxied to Spring Boot, so the phone never talks to localhost:8080 directly.
export default defineConfig(({ mode }) => ({
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
