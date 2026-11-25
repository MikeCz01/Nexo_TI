
import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from './Sidebar'
import './DashboardLayout.css'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/tickets': 'Gestión de tickets',
  '/users': 'Usuarios',
  '/clients': 'Clientes',
  '/reports': 'Reportes',
  '/history': 'Historial de actividades',
}

export default function DashboardLayout() {
  const { user } = useAuth()
  const location = useLocation()

  const pageTitle = location.pathname.startsWith('/tickets/')
  ? 'Detalles del ticket'
  : pageTitles[location.pathname] || 'Nexo TI'

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <span className="dashboard-header-label">
              SISTEMA DE SOPORTE TÉCNICO
            </span>
            <h1>{pageTitle}</h1>
          </div>

          <div className="dashboard-header-user">
            <div className="dashboard-header-user-info">
              <strong>{user?.full_name}</strong>
              <span>{user?.email}</span>
            </div>

            <div className="dashboard-header-avatar">
              {user?.full_name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <section className="dashboard-content">
          <Outlet />
        </section>
      </main>
    </div>
  )
}
