import React from "react"
import { Link } from "react-router-dom"

const MovieCard = ({ movie }) => {
  return (
    <div
      className="bg-white rounded-xl shadow-xl overflow-hidden 
                    transform transition-all duration-300 ease-in-out 
                    hover:scale-[1.03] hover:shadow-2xl group"
    >
      <div className="relative overflow-hidden">
        <img
          src={movie.poster}
          alt={movie.title}
          className="w-full h-72 object-cover 
                     transition duration-500 group-hover:opacity-85"
        />

        <div className="absolute inset-0 bg-[#8CE4FF]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      <div className="p-5 flex flex-col justify-between h-auto">
        <div className="mb-4">
          <h3 className="text-2xl font-extrabold text-gray-800 mb-1 leading-snug">
            {movie.title}
          </h3>
          <p className="text-gray-500 text-sm h-10 overflow-hidden">
            {movie.description}
          </p>
        </div>

        <button
<<<<<<< HEAD
          className="w-full text-center inline-block 
=======
          className="cursor-pointer w-full text-center inline-block 
>>>>>>> cinebook-frontend
                     bg-[#FF5656] hover:bg-[#CD2C58] text-white 
                     px-4 py-3 rounded-lg font-bold uppercase tracking-wider 
                     transition duration-300 transform hover:scale-[1.01] 
                     shadow-md hover:shadow-lg"
        >
          Book Tickets
        </button>
      </div>
    </div>
  )
}

export default MovieCard
