export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1600&auto=format&fit=crop"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-bg via-bg/50 to-bg/10" />
        <div className="absolute bottom-12 left-12 right-12">
          <p className="font-display text-4xl font-bold leading-tight">The best seat in the house<br />is one tap away.</p>
          <p className="mt-3 text-muted">Live seat maps, secure Stripe checkout and instant QR tickets.</p>
        </div>
      </div>
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 text-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  )
}
