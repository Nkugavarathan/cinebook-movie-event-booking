import React, { useState } from "react"
import { Link } from "react-router-dom"
import { Menu, X } from "lucide-react" // Import the icons

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  const NavLinks = (
    <>
      <li>
        <Link
          to="/"
          className="hover:text-[#FF5656] font-semibold transition duration-200"
          onClick={() => setIsOpen(false)} //close menu
        >
          Home
        </Link>
      </li>
      {/* <li>
        <Link
          to="/about"
          className="hover:text-[#FF5656] font-semibold transition duration-200"
          onClick={() => setIsOpen(false)}
        >
          About
        </Link>
      </li> */}
      <li>
        <Link
          to="/login"
          className="hover:text-[#FF5656] font-semibold transition duration-200"
          onClick={() => setIsOpen(false)}
        >
          Login
        </Link>
      </li>
      {/*
      <li>
        <Link
          to="/book"
          className="bg-[#CD2C58] text-white px-3 py-1.5 rounded hover:bg-[#FF5656] font-semibold transition duration-200"
          onClick={() => setIsOpen(false)}
        >
          Book Ticket
        </Link>
      </li> */}
    </>
  )

  return (
    <nav className="bg-[#8CE4FF] shadow-lg p-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="text-2xl font-extrabold text-[#CD2C58]">CineBook</div>

        {/* Hidden on small screens, shown as a flex row on medium screens and up */}
        <ul className="hidden md:flex space-x-6 items-center text-gray-800">
          {NavLinks}
        </ul>

        {/* Mobile Menu Button  */}
        {/* Shown on small screens, hidden on medium screens and up */}
        <button
          onClick={toggleMenu}
          className="md:hidden text-gray-800 hover:text-[#CD2C58] transition duration-200 p-1"
          aria-label="Toggle menu"
        >
          {/* switch  Menu and X icons */}
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/*  Mobile Menu Dropdown */}

      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-96 opacity-100 mt-2" : "max-h-0 opacity-0"
        }`}
      >
        <ul className="flex flex-col space-y-3 p-4 bg-white rounded-lg shadow-xl text-gray-800 border border-gray-100">
          {NavLinks}
        </ul>
      </div>
    </nav>
  )
}

export default Navbar
