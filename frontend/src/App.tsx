

import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './components/DashboardLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import TicketDetails from './pages/TicketDetails'
import Tickets from './pages/Tickets'

function PlaceholderPage() {
  const location = useLocation()

  const moduleNames: Record<string, string> = {
    '/tickets': 'Gestión de tickets',
    '/users': 'Administración de usuarios',
    '/clients': 'Gestión de clientes',
    '/reports': 'Reportes',
    '/history': 'Historial de actividades',
  }

  return (
    <div>
      <h2>{moduleNames[location.pathname]}</h2>
      <p>Este módulo se encuentra en desarrollo.</p>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/tickets/:ticketId" element={<TicketDetails />} />
          <Route path="/users" element={<PlaceholderPage />} />
          <Route path="/clients" element={<PlaceholderPage />} />
          <Route path="/reports" element={<PlaceholderPage />} />
          <Route path="/history" element={<PlaceholderPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
