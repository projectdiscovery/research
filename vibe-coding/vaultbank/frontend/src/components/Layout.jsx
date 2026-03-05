import Sidebar from './Sidebar'
import Navbar from './Navbar'
import NotificationBell from './NotificationBell'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-navy-900">
      <Sidebar />
      <Navbar notificationBell={<NotificationBell />} />
      <main className="lg:pl-64">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
