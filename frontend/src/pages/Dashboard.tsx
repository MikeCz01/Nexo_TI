
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getTicketStatistics,
  getTickets,
  type Ticket,
  type TicketStatistics,
} from '../services/api'
import './Dashboard.css'

export default function Dashboard() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [statistics, setStatistics] = useState<TicketStatistics | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDashboard = useCallback(async () => {
    if (!token) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')

      const [statisticsData, ticketsData] = await Promise.all([
        getTicketStatistics(token),
        getTickets(token),
      ])

      setStatistics(statisticsData)
      setTickets(ticketsData)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo cargar la información del dashboard',
      )
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  const cards = [
    {
      title: 'Total de tickets',
      value: statistics?.total ?? 0,
      color: 'blue',
      symbol: 'T',
    },
    {
      title: 'Tickets abiertos',
      value: statistics?.open ?? 0,
      color: 'orange',
      symbol: 'A',
    },
    {
      title: 'En progreso',
      value: statistics?.in_progress ?? 0,
      color: 'purple',
      symbol: 'P',
    },
    {
      title: 'Resueltos',
      value: statistics?.resolved ?? 0,
      color: 'green',
      symbol: 'R',
    },
    {
      title: 'Sin asignar',
      value: statistics?.unassigned ?? 0,
      color: 'red',
      symbol: '!',
    },
  ]

  const statuses = [
    {
      title: 'Abiertos',
      value: statistics?.open ?? 0,
      color: 'orange',
    },
    {
      title: 'En progreso',
      value: statistics?.in_progress ?? 0,
      color: 'purple',
    },
    {
      title: 'Resueltos',
      value: statistics?.resolved ?? 0,
      color: 'green',
    },
    {
      title: 'Cerrados',
      value: statistics?.closed ?? 0,
      color: 'blue',
    },
  ]

  const statusLabels: Record<Ticket['status'], string> = {
    open: 'Abierto',
    in_progress: 'En progreso',
    resolved: 'Resuelto',
    closed: 'Cerrado',
  }

  const priorityLabels: Record<Ticket['priority'], string> = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
  }

  const getPercentage = (value: number) => {
    if (!statistics || statistics.total === 0) return 0

    return Math.round((value / statistics.total) * 100)
  }

  const recentTickets = [...tickets]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime(),
    )
    .slice(0, 5)

  const formatDate = (date: string) =>
    new Intl.DateTimeFormat('es-HN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(date))

  return (
    <section className="dashboard">
      <div className="dashboard-header">
        <div>
          <h2>¡Bienvenido, {user?.full_name}!</h2>
          <p>
            Desde este panel podrás administrar y supervisar las
            operaciones de soporte técnico de Nexo TI.
          </p>
        </div>

        <button
          className="refresh-button"
          onClick={() => void loadDashboard()}
          disabled={loading}
        >
          {loading ? 'Actualizando...' : '↻ Actualizar'}
        </button>
      </div>

      <div className="section-heading">
        <h3>Resumen de tickets</h3>
        <span>Estadísticas generales</span>
      </div>

      {loading && <p>Cargando información...</p>}

      {error && <p role="alert">{error}</p>}

      {statistics && !loading && (
        <>
          <div className="dashboard-stats">
            {cards.map((card) => (
              <article
                className={`stat-card stat-${card.color}`}
                key={card.title}
              >
                <div className="stat-card-top">
                  <h4>{card.title}</h4>
                  <span className="stat-symbol">{card.symbol}</span>
                </div>
                <strong>{card.value}</strong>
              </article>
            ))}
          </div>

          <div className="dashboard-panels">
            <article className="dashboard-panel">
              <div className="section-heading">
                <h3>Tickets por estado</h3>
                <span>{statistics.total} tickets en total</span>
              </div>

              <div className="status-chart">
                {statuses.map((status) => (
                  <div className="status-row" key={status.title}>
                    <div className="status-info">
                      <span>{status.title}</span>
                      <strong>{status.value}</strong>
                    </div>

                    <div className="status-track">
                      <div
                        className={`status-fill fill-${status.color}`}
                        style={{
                          width: `${getPercentage(status.value)}%`,
                        }}
                      />
                    </div>

                    <span className="status-percentage">
                      {getPercentage(status.value)}%
                    </span>
                  </div>
                ))}
              </div>
            </article>

            <article className="dashboard-panel">
              <div className="section-heading">
                <h3>Tickets por prioridad</h3>
                <span>Distribución</span>
              </div>

              <div className="priority-list">
                <div className="priority-item">
                  <span className="priority-dot priority-low" />
                  <span>Prioridad baja</span>
                  <strong>{statistics.priority.low}</strong>
                </div>

                <div className="priority-item">
                  <span className="priority-dot priority-medium" />
                  <span>Prioridad media</span>
                  <strong>{statistics.priority.medium}</strong>
                </div>

                <div className="priority-item">
                  <span className="priority-dot priority-high" />
                  <span>Prioridad alta</span>
                  <strong>{statistics.priority.high}</strong>
                </div>
              </div>
            </article>
          </div>

          <article className="recent-tickets">
            <div className="section-heading">
              <h3>Tickets recientes</h3>
              <span>Últimos 5 tickets registrados</span>
            </div>

            {recentTickets.length === 0 ? (
              <p className="empty-tickets">
                Todavía no hay tickets registrados.
              </p>
            ) : (
              <div className="tickets-table-container">
                <table className="tickets-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Asunto</th>
                      <th>Cliente</th>
                      <th>Estado</th>
                      <th>Prioridad</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentTickets.map((ticket) => (
                      <tr
  			key={ticket.id}
  			className="clickable-ticket-row"
  			onClick={() => navigate(`/tickets/${ticket.id}`)}
 			 title="Ver detalles del ticket"
			>
                        <td>#{ticket.id}</td>
                        <td className="ticket-title">
                          {ticket.title}
                        </td>
                        <td>Cliente #{ticket.client_id}</td>
                        <td>
                          <span
                            className={`ticket-badge status-${ticket.status}`}
                          >
                            {statusLabels[ticket.status]}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`ticket-badge priority-${ticket.priority}`}
                          >
                            {priorityLabels[ticket.priority]}
                          </span>
                        </td>
                        <td>{formatDate(ticket.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </>
      )}
    </section>
  )
}
