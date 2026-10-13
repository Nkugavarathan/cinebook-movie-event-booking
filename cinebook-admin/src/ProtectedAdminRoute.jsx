import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "./context/AuthContext"

/** Where each role lands after signing in. */
// eslint-disable-next-line react-refresh/only-export-components
export const homeFor = (role) => (role === "STAFF" ? "/admin/checkin" : "/admin/dashboard")

const ProtectedAdminRoute = () => {
  const { token, user } = useAuth()
  const location = useLocation()

  if (!token || (user?.role !== "ADMIN" && user?.role !== "STAFF")) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  // Door staff only get the check-in scanner (the server enforces this too).
  if (user.role === "STAFF" && !location.pathname.startsWith("/admin/checkin")) {
    return <Navigate to="/admin/checkin" replace />
  }
  return <Outlet />
}

export default ProtectedAdminRoute
