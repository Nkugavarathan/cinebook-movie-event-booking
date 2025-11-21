import React from "react"
// import { Link } from "react-router-dom"
import { Calendar } from "lucide-react"

function EventCard({ event }) {
  const formattedDate = new Date(event.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })

  return (
    <div
      className="  bg-white rounded-xl shadow-lg overflow-hidden 
                    transform transition-all duration-300 ease-in-out 
                    hover:scale-[1.03] hover:shadow-2xl flex flex-col h-full"
    >
      <div className="relative overflow-hidden">
        <img
          src={event.poster}
          alt={event.title}
          className="w-full h-56 object-cover transition duration-500 hover:opacity-90"
        />

        <div className="absolute top-3 right-3 bg-[#C2E2FA] text-gray-800 text-sm font-semibold px-3 py-1 rounded-full shadow-md">
          {formattedDate}
        </div>
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <div className="mb-4 flex-grow">
          <h3 className="text-xl font-extrabold text-gray-800 mb-2 leading-snug">
            {event.title}
          </h3>
          <div className="flex items-center text-gray-500 text-sm">
            <Calendar size={16} className="text-[#CD2C58] mr-2" />
            <span className="font-medium">{formattedDate}</span>
          </div>
        </div>

        <button
          className="w-full text-center inline-block 
                     bg-[#FF5656] hover:bg-[#CD2C58] text-white 
                     px-4 py-3 rounded-lg font-bold uppercase tracking-wider 
                     transition duration-300 transform hover:scale-[1.01] 
                     shadow-md"
        >
          View Details
        </button>
      </div>
    </div>
  )
}

export default EventCard
