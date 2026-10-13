import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import ProtectedAdminRoute from "./ProtectedAdminRoute"
import AdminLayout from "./components/AdminLayout"
import Login from "./pages/Login"
import AdminDashboard from "./pages/AdminDashboard"
import MoviesList from "./pages/admin/movies/MoviesList"
import AddMovie from "./pages/admin/movies/AddMovie"
import EditMovie from "./pages/admin/movies/EditMovie"
import EventsList from "./pages/admin/events/EventsList"
import EventEditor from "./pages/admin/events/EventEditor"
import TheaterList from "./pages/admin/Theaters/TheaterList"
import EditTheater from "./pages/admin/Theaters/EditTheater"
import AdminScreensList from "./pages/admin/screens/AdminScreensList"
import AddScreen from "./pages/admin/screens/AddScreen"
import AdminShowTimesList from "./pages/admin/showtimes/AdminShowTImesList"
import AddShowTime from "./pages/admin/showtimes/AddShowTime"
import BookingsList from "./pages/admin/bookings/BookingsList"
import UsersList from "./pages/admin/users/UsersList"
import PromosList from "./pages/admin/promos/PromosList"
import CheckIn from "./pages/admin/checkin/CheckIn"
import ReviewsList from "./pages/admin/reviews/ReviewsList"
import { useAuth } from "./context/AuthContext"
import { homeFor } from "./ProtectedAdminRoute"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedAdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/movies" element={<MoviesList />} />
            <Route path="/admin/movies/add" element={<AddMovie />} />
            <Route path="/admin/movies/edit/:id" element={<EditMovie />} />
            <Route path="/admin/events" element={<EventsList />} />
            <Route path="/admin/events/add" element={<EventEditor />} />
            <Route path="/admin/events/edit/:id" element={<EventEditor />} />
            <Route path="/admin/theaters" element={<TheaterList />} />
            <Route path="/admin/theaters/:id" element={<EditTheater />} />
            <Route path="/admin/screens" element={<AdminScreensList />} />
            <Route path="/admin/screens/add" element={<AddScreen />} />
            <Route path="/admin/screens/edit/:id" element={<AddScreen />} />
            <Route path="/admin/showtimes" element={<AdminShowTimesList />} />
            <Route path="/admin/showtimes/add" element={<AddShowTime />} />
            <Route path="/admin/bookings" element={<BookingsList />} />
            <Route path="/admin/users" element={<UsersList />} />
            <Route path="/admin/promos" element={<PromosList />} />
            <Route path="/admin/checkin" element={<CheckIn />} />
            <Route path="/admin/reviews" element={<ReviewsList />} />
          </Route>
        </Route>
        <Route path="*" element={<Home />} />
      </Routes>
    </BrowserRouter>
  )
}

/** Unknown URLs go to the signed-in user's home (scanner for staff, dashboard for admins). */
function Home() {
  const { user } = useAuth()
  return <Navigate to={homeFor(user?.role)} replace />
}
