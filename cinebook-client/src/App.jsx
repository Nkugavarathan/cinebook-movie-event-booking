import { useEffect } from "react"
import { Routes, Route, useLocation } from "react-router-dom"
import Navbar from "./components/Navbar"
import Footer from "./components/Footer"
import ProtectedRoute from "./components/ProtectedRoute"
import Home from "./pages/Home"
import Movies from "./pages/Movies"
import MovieDetail from "./pages/MovieDetail"
import SeatSelection from "./pages/SeatSelection"
import Checkout from "./pages/Checkout"
import PaymentSuccess from "./pages/PaymentSuccess"
import PaymentCancel from "./pages/PaymentCancel"
import MyBookings from "./pages/MyBookings"
import BookingDetail from "./pages/BookingDetail"
import Login from "./pages/Login"
import Register from "./pages/Register"
import NotFound from "./pages/NotFound"

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname])
  return null
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/movies/:id" element={<MovieDetail />} />
          <Route path="/book/:showtimeId" element={<SeatSelection />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/checkout/:bookingId" element={<Checkout />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/cancel" element={<PaymentCancel />} />
            <Route path="/bookings" element={<MyBookings />} />
            <Route path="/bookings/:id" element={<BookingDetail />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
