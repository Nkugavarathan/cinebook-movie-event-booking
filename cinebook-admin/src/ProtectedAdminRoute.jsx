import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "./context/AuthContext"

const ProtectedAdminRoute = () => {
  const { token, user } = useAuth()
  const location = useLocation()

  if (!token || user?.role !== "ADMIN") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}

export default ProtectedAdminRoute
