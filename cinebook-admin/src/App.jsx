import { BrowserRouter, Routes, Route } from "react-router-dom"
import AdminDashboard from "./pages/AdminDashboard"
import ProtectedAdminRoute from "./ProtectedAdminRoute"
import MoviesList from "./pages/admin/movies/MoviesList"
import AddMovie from "./pages/admin/movies/AddMovie"
import EditMovie from "./pages/admin/movies/EditMovie"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Admin Dashboard 
        element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
        */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          }
        />
        <Route path="/admin/movies" element={<MoviesList />} />
        <Route path="/admin/movies/add" element={<AddMovie />} />
        <Route path="/admin/movies/edit/:id" element={<EditMovie />} />
      </Routes>
    </BrowserRouter>
  )
}
