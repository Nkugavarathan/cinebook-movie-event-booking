import { Link } from "react-router-dom"

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-28 text-center">
      <p className="font-display text-8xl font-extrabold text-surface-2">404</p>
      <h1 className="mt-2 font-display text-3xl font-bold">This scene was cut</h1>
      <p className="mt-2 text-muted">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn-primary mt-8">Back to movies</Link>
    </div>
  )
}
