import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import "./index.css"
import App from "./App.jsx"
import { AuthProvider } from "./context/AuthContext.jsx"
import { ThemeProvider } from "./context/ThemeContext.jsx"
import ThemedToaster from "./components/ThemedToaster.jsx"

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <App />
          <ThemedToaster />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>
)
