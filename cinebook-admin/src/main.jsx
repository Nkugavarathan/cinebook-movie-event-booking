import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.jsx"
import { AuthProvider } from "./context/AuthContext.jsx"
import { ThemeProvider } from "./context/ThemeContext.jsx"
import ThemedToaster from "./components/ThemedToaster.jsx"

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App />
        <ThemedToaster />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
)
