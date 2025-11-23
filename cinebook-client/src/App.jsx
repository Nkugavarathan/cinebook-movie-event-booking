import React from "react"
import Home from "./pages/Home"
import { Routes, Route } from "react-router-dom"
import Navbar from "./components/Navbar"
import Footer from "./components/Footer"
<<<<<<< HEAD
=======
import Login from "./pages/Login"
import Register from "./pages/Register"
>>>>>>> cinebook-frontend

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
<<<<<<< HEAD
        <Route path="" />
=======
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
>>>>>>> cinebook-frontend
        <Route />
      </Routes>
      <Footer />
    </>
  )
}

export default App
