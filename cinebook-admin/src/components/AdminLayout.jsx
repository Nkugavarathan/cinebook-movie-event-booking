import { useState } from "react"
import { Outlet } from "react-router-dom"
import AdminSidebar from "./Sidebar"
import AdminHeader from "./Header"

export default function AdminLayout() {
  const [open, setOpen] = useState(false)
  return (
    <div className="flex min-h-screen">
      <AdminSidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader onMenu={() => setOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
