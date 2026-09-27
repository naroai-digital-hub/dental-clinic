import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import PublicHome from './pages/PublicHome'
import AdminLogin from './pages/AdminLogin'
import AdminLayout from './pages/AdminLayout'
import AdminOverview from './pages/AdminOverview'
import AdminAppointments from './pages/AdminAppointments'
import AdminServices from './pages/AdminServices'
import AdminHours from './pages/AdminHours'
import AdminBlockedDates from './pages/AdminBlockedDates'
import AdminSettings from './pages/AdminSettings'
import ProtectedRoute from './components/admin/ProtectedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicHome />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminOverview />} />
          <Route path="appointments" element={<AdminAppointments />} />
          <Route path="services" element={<AdminServices />} />
          <Route path="hours" element={<AdminHours />} />
          <Route path="blocked-dates" element={<AdminBlockedDates />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
