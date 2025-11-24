import React, { useEffect, useState } from "react"
import EventCard from "../components/EventCard"
import MovieCard from "../components/MovieCard"
import api from "../services/api"

function Home() {
  const [movie, setMovies] = useState([])
  const [event, setEvents] = useState([])

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const response = await api.get("/movies")
        setMovies(response.data)
      } catch (error) {
        console.log(error)
      }
    }
    fetchMovie()
  })

  const movies = [
    {
      id: 1,
      title: "Avatar 2",
      poster:
        "https://m.media-amazon.com/images/S/pv-target-images/48448d3f65992c3c9da909933f7fa659efe20d88becd4b62459bc62e0da1889a.jpg",
      description: "Epic sci-fi movie",
    },
    {
      id: 2,
      title: "The Batman",
      poster: "/batman.jpg",
      description: "Dark superhero film",
    },
    {
      id: 3,
      title: "Oppenheimer",
      poster: "/oppenheimer.jpg",
      description: "Historical drama",
    },
    {
      id: 4,
      title: "Spider-Man",
      poster: "/spiderman.jpg",
      description: "Action adventure",
    },
  ]

  const events = [
    {
      id: 1,
      title: "Neon Concert",
      poster:
        "https://m.media-amazon.com/images/S/pv-target-images/48448d3f65992c3c9da909933f7fa659efe20d88becd4b62459bc62e0da1889a.jpg",
      date: "2025-12-05",
    },
    { id: 2, title: "Hamlet Play", poster: "/play.jpg", date: "2025-12-08" },
    { id: 3, title: "Comedy Night", poster: "/comedy.jpg", date: "2025-12-10" },
    { id: 4, title: "Jazz Festival", poster: "/jazz.jpg", date: "2025-12-15" },
  ]
  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      {/* hero section */}
      <section className="relative w-full h-[90vh] flex items-center justify-center text-center ">
        <img
          src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format&fit=crop"
          alt="Cinema Background"
          className="absolute inset-0 z-0 w-full h-full object-cover"
        />
        {/* Gradient Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80"></div>

        {/* Hero Content */}
        <div className="relative z-20 max-w-4xl animate-fade-in-up">
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight drop-shadow-lg">
            Book Movies & Events <br />
            <span className="text-[#8CE4FF]">Instantly</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-200 mb-10 max-w-2xl mx-auto font-light">
            Experience your favorite shows with ease, comfort, and safety. Your
            next memory is just a click away.
          </p>

          <div className="flex gap-4 justify-center">
            <button className="bg-[#FF5656] hover:bg-[#CD2C58] text-white px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
              Browse Now
            </button>
            <button className="bg-transparent border-2 border-white hover:bg-white hover:text-black text-white px-8 py-4 rounded-full font-bold text-lg transition-all duration-300">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Movie section  */}
      <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-end mb-10 border-b border-gray-200 pb-4">
          <div>
            <h2 className="text-4xl font-bold text-gray-900">Now Showing</h2>
            <p className="text-gray-500 mt-2">
              Catch the latest blockbusters playing near you
            </p>
          </div>
          <a
            href="/movies"
            className="text-[#CD2C58] font-semibold hover:underline hidden sm:block"
          >
            View All
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {movie.map((movie) => (
            <div
              key={movie.id}
              className="transform transition-all duration-300 hover:-translate-y-2"
            >
              <MovieCard movie={movie} />
            </div>
          ))}
        </div>
      </section>

      {/* Event section */}
      <section className="py-20 px-6 md:px-12 bg-[#ECD5BC] w-full">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-[#CD2C58]">
              Upcoming Events
            </h2>
            <p className="text-gray-800 mt-3 text-lg">
              Concerts, Plays, and Stand-up Comedy
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 group"
              >
                <EventCard event={event} />
                <div className="p-4 bg-white group-hover:bg-[#C2E2FA] transition-colors duration-300">
                  <button className="w-full text-[#CD2C58] font-bold text-sm uppercase tracking-wider">
                    Get Tickets
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
