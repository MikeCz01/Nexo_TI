
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Sidebar.css'

interface MenuItem {
  label: string
  path: string
  icon: string
  roles: string[]
}

const menuItems: MenuItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: '▦',
    roles: ['admin', 'supervisor', 'technician', 'client'],
  },
  {
    label: 'Tickets',
    path: '/tickets',
    icon: '▤',
    roles: ['admin', 'supervisor', 'technician', 'client'],
  },
  {
    label: 'Usuarios',
    path: '/users',
    icon: '♙',
    roles: ['admin', 'supervisor'],
  },
  {
    label: 'Clientes',
    path: '/clients',
    icon: '▣',
    roles: ['admin', 'supervisor'],
  },
  {
    label: 'Reportes',
    path: '/reports',
    icon: '▥',
    roles: ['admin', 'supervisor'],
  },
  {
    label: 'Historial',
    path: '/history',
    icon: '◷',
    roles: ['admin', 'supervisor', 'technician'],
  },
]

export default function Sidebar() {
  const { user, signOut } = useAuth()

  const userRole = user?.role_id === 1
    ? 'admin'
    : user?.role_id === 2
      ? 'supervisor'
      : user?.role_id === 3
        ? 'technician'
        : 'client'

  const visibleItems = menuItems.filter((item) =>
    item.roles.includes(userRole),
  )

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">N</div>
        <div>
          <h2>Nexo TI</h2>
          <span>IT SERVICE MANAGEMENT</span>
        </div>
      </div>

      <div className="sidebar-section-label">MENÚ PRINCIPAL</div>

      <nav className="sidebar-navigation">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/dashboard'}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <span className="sidebar-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user?.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="sidebar-user-info">
            <strong>{user?.full_name}</strong>
            <span>{userRole}</span>
          </div>
        </div>

        <button className="sidebar-logout" onClick={signOut}>
          <span>↪</span>
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
