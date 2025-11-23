import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.jsx"
import { BrowserRouter } from "react-router-dom"
<<<<<<< HEAD

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
=======
import { AuthProvider } from "./context/AuthContext.jsx"

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
>>>>>>> cinebook-frontend
  </BrowserRouter>
)
