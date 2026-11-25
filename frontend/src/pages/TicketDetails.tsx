import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  getTicketById,
  getTicketHistory,
  updateTicketStatus,
  type Ticket,
  type TicketEvent,
} from '../services/api'
import './TicketDetails.css'

const statusLabels: Record<string, string> = {
  open: 'Abierto',
  in_progress: 'En progreso',
  resolved: 'Resuelto',
  closed: 'Cerrado',
}

const priorityLabels: Record<string, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
}

const eventLabels: Record<string, string> = {
  created: 'Ticket creado',
  assigned: 'Técnico asignado',
  status_changed: 'Cambio de estado',
}

const statusOptions: Ticket['status'][] = [
  'open',
  'in_progress',
  'resolved',
  'closed',
]

function formatDate(date: string) {
  return new Intl.DateTimeFormat('es-HN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export default function TicketDetails() {
  const { ticketId } = useParams()
  const navigate = useNavigate()
  const { token, user } = useAuth()

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [history, setHistory] = useState<TicketEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [selectedStatus, setSelectedStatus] =
    useState<Ticket['status']>('open')
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [statusSuccess, setStatusSuccess] = useState('')
  const [statusError, setStatusError] = useState('')

  useEffect(() => {
    async function loadTicketDetails() {
      if (!token || !ticketId) return

      try {
        setLoading(true)
        setError('')

        const id = Number(ticketId)

        if (!Number.isInteger(id) || id <= 0) {
          throw new Error('El número de ticket no es válido')
        }

        const [ticketData, historyData] = await Promise.all([
          getTicketById(token, id),
          getTicketHistory(token, id),
        ])

        setTicket(ticketData)
        setSelectedStatus(ticketData.status)
        setHistory(historyData)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'No se pudieron cargar los detalles del ticket',
        )
      } finally {
        setLoading(false)
      }
    }

    void loadTicketDetails()
  }, [token, ticketId])

  async function handleStatusUpdate() {
    if (!token || !ticket || selectedStatus === ticket.status) return

    try {
      setUpdatingStatus(true)
      setStatusError('')
      setStatusSuccess('')

      const updatedTicket = await updateTicketStatus(
        token,
        ticket.id,
        selectedStatus,
      )

      setTicket(updatedTicket)
      setSelectedStatus(updatedTicket.status)
      setStatusSuccess('El estado del ticket se actualizó correctamente.')

      try {
        const updatedHistory = await getTicketHistory(token, ticket.id)
        setHistory(updatedHistory)
      } catch {
        setStatusError(
          'El estado se actualizó, pero no se pudo recargar el historial. Recarga la página.',
        )
      }
    } catch (err) {
      setStatusError(
        err instanceof Error
          ? err.message
          : 'No se pudo actualizar el estado del ticket',
      )
    } finally {
      setUpdatingStatus(false)
    }
  }

  const canUpdateStatus =
    user !== null &&
    ticket !== null &&
    (
      user.role_id === 1 ||
      user.role_id === 2 ||
      (user.role_id === 3 && ticket.assigned_to === user.id)
    )

  if (loading) {
    return (
      <div className="ticket-details-loading">
        Cargando detalles del ticket...
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="ticket-details-error">
        <p>{error || 'No se encontró el ticket'}</p>
        <button onClick={() => navigate('/tickets')}>
          Volver a tickets
        </button>
      </div>
    )
  }

  return (
    <div className="ticket-details-page">
      <button
        className="back-button"
        onClick={() => navigate('/tickets')}
      >
        ← Volver a tickets
      </button>

      <div className="ticket-details-heading">
        <div>
          <span className="ticket-number">TICKET #{ticket.id}</span>
          <h2>{ticket.title}</h2>
          <p>Información completa de la solicitud de soporte</p>
        </div>

        <span className={`ticket-badge status-${ticket.status}`}>
          {statusLabels[ticket.status]}
        </span>
      </div>

      {canUpdateStatus && (
        <section className="ticket-status-card">
          <h3>Actualizar estado del ticket</h3>
          <p className="ticket-status-description">
            Selecciona el nuevo estado para actualizar el seguimiento de esta solicitud.
          </p>

          <div className="ticket-status-form">
            <div className="ticket-status-field">
              <label htmlFor="ticket-status">Nuevo estado</label>

              <select
                id="ticket-status"
                value={selectedStatus}
                onChange={(event) =>
                  setSelectedStatus(event.target.value as Ticket['status'])
                }
                disabled={updatingStatus}
              >
                {statusOptions.map((status) => (
                  <option value={status} key={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="ticket-status-submit"
              onClick={() => void handleStatusUpdate()}
              disabled={
                updatingStatus || selectedStatus === ticket.status
              }
            >
              {updatingStatus ? 'Actualizando...' : 'Guardar cambios'}
            </button>
          </div>

          {statusSuccess && (
            <div className="ticket-status-success">
              {statusSuccess}
            </div>
          )}

          {statusError && (
            <div className="ticket-status-error">
              {statusError}
            </div>
          )}
        </section>
      )}

      <div className="ticket-details-grid">
        <section className="ticket-info-card">
          <h3>Descripción del problema</h3>
          <p className="ticket-description">{ticket.description}</p>

          <div className="ticket-metadata">
            <div>
              <span>Prioridad</span>
              <strong className={`ticket-badge priority-${ticket.priority}`}>
                {priorityLabels[ticket.priority]}
              </strong>
            </div>

            <div>
              <span>Cliente</span>
              <strong>Cliente #{ticket.client_id}</strong>
            </div>

            <div>
              <span>Reportado por</span>
              <strong>Usuario #{ticket.created_by}</strong>
            </div>

            <div>
              <span>Técnico asignado</span>
              <strong>
                {ticket.assigned_to
                  ? `Usuario #${ticket.assigned_to}`
                  : 'Sin asignar'}
              </strong>
            </div>

            <div>
              <span>Fecha de creación</span>
              <strong>{formatDate(ticket.created_at)}</strong>
            </div>

            <div>
              <span>Última actualización</span>
              <strong>{formatDate(ticket.updated_at)}</strong>
            </div>
          </div>
        </section>

        <section className="ticket-history-card">
          <h3>Historial de actividades</h3>
          <p className="history-subtitle">
            Registro de cambios realizados en este ticket
          </p>

          {history.length === 0 ? (
            <div className="empty-history">
              No hay actividades registradas.
            </div>
          ) : (
            <div className="ticket-timeline">
              {history.map((event) => (
                <div className="timeline-item" key={event.id}>
                  <div className="timeline-marker" />

                  <div className="timeline-content">
                    <strong>
                      {eventLabels[event.event_type] || event.event_type}
                    </strong>

                    <span>Usuario #{event.actor_id}</span>

                    {event.old_value !== null && (
                      <p>Valor anterior: {event.old_value}</p>
                    )}

                    {event.new_value !== null && (
                      <p>Nuevo valor: {event.new_value}</p>
                    )}

                    <time>{formatDate(event.created_at)}</time>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
