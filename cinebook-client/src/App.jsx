import React from "react"
import Home from "./pages/Home"
import { Routes, Route } from "react-router-dom"
import Navbar from "./components/Navbar"
import Footer from "./components/Footer"

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="" />
        <Route />
      </Routes>
      <Footer />
    </>
  )
}

export default App
