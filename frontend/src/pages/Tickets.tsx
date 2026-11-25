

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  createTicket,
  getTickets,
  type Ticket,
} from '../services/api'
import './Tickets.css'

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

function formatDate(date: string) {
  return new Intl.DateTimeFormat('es-HN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export default function Tickets() {
  const { token, user } = useAuth()
  const navigate = useNavigate()

  const isClient = user?.role_id === 4

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Ticket['priority']>('medium')
  const [submitting, setSubmitting] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createSuccess, setCreateSuccess] = useState('')

  async function loadTickets() {
    if (!token) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError('')

      const data = await getTickets(token)
      setTickets(data)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudieron cargar los tickets',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadTickets()
  }, [token])

  async function handleCreateTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!token || !isClient) return

    try {
      setSubmitting(true)
      setCreateError('')
      setCreateSuccess('')

      await createTicket(token, {
        title: title.trim(),
        description: description.trim(),
        priority,
      })

      setTitle('')
      setDescription('')
      setPriority('medium')
      setCreateSuccess('Tu solicitud de soporte se creó correctamente.')

      await loadTickets()
    } catch (err) {
      setCreateError(
        err instanceof Error
          ? err.message
          : 'No se pudo crear el ticket. Inténtalo nuevamente.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const filteredTickets = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return tickets
      .filter((ticket) => {
        const matchesSearch =
          normalizedSearch === '' ||
          ticket.title.toLowerCase().includes(normalizedSearch) ||
          ticket.description.toLowerCase().includes(normalizedSearch) ||
          String(ticket.id).includes(normalizedSearch) ||
          String(ticket.client_id).includes(normalizedSearch)

        const matchesStatus =
          statusFilter === 'all' || ticket.status === statusFilter

        const matchesPriority =
          priorityFilter === 'all' ||
          ticket.priority === priorityFilter

        return matchesSearch && matchesStatus && matchesPriority
      })
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime(),
      )
  }, [tickets, search, statusFilter, priorityFilter])

  function clearFilters() {
    setSearch('')
    setStatusFilter('all')
    setPriorityFilter('all')
  }

  return (
    <section className="tickets-page">
      <div className="tickets-page-heading">
        <div>
          <h2>Gestión de tickets</h2>
          <p>
            Consulta y administra las solicitudes de soporte técnico.
          </p>
        </div>

        <div className="tickets-total">
          <strong>{tickets.length}</strong>
          <span>Tickets registrados</span>
        </div>
      </div>

      {isClient && (
        <div className="ticket-create-card">
          <div className="ticket-create-heading">
            <h3>Nueva solicitud de soporte</h3>
            <p>
              Describe el problema que estás experimentando para que
              nuestro equipo pueda ayudarte.
            </p>
          </div>

          <form
            className="ticket-create-form"
            onSubmit={handleCreateTicket}
          >
            <div className="ticket-create-field">
              <label htmlFor="ticket-title">Asunto</label>
              <input
                id="ticket-title"
                type="text"
                placeholder="Ej. Problemas con la conexión a Internet"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                minLength={5}
                maxLength={150}
                required
              />
              <small>{title.length}/150 caracteres</small>
            </div>

            <div className="ticket-create-field">
              <label htmlFor="ticket-description">Descripción</label>
              <textarea
                id="ticket-description"
                placeholder="Explica detalladamente el problema..."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                minLength={10}
                maxLength={5000}
                required
              />
              <small>{description.length}/5000 caracteres</small>
            </div>

            <div className="ticket-create-field">
              <label htmlFor="ticket-new-priority">Prioridad</label>
              <select
                id="ticket-new-priority"
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value as Ticket['priority'])
                }
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
              </select>
            </div>

            {createError && (
              <div className="ticket-create-error" role="alert">
                {createError}
              </div>
            )}

            {createSuccess && (
              <div className="ticket-create-success" role="status">
                {createSuccess}
              </div>
            )}

            <button
              className="ticket-create-submit"
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Enviando solicitud...' : 'Crear solicitud'}
            </button>
          </form>
        </div>
      )}

      <div className="tickets-filters">
        <div className="ticket-search">
          <label htmlFor="ticket-search">Buscar tickets</label>
          <input
            id="ticket-search"
            type="search"
            placeholder="Buscar por título, descripción o ID..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="ticket-filter">
          <label htmlFor="ticket-status">Estado</label>
          <select
            id="ticket-status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">Todos los estados</option>
            <option value="open">Abierto</option>
            <option value="in_progress">En progreso</option>
            <option value="resolved">Resuelto</option>
            <option value="closed">Cerrado</option>
          </select>
        </div>

        <div className="ticket-filter">
          <label htmlFor="ticket-priority">Prioridad</label>
          <select
            id="ticket-priority"
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
          >
            <option value="all">Todas las prioridades</option>
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
          </select>
        </div>

        <button
          className="clear-filters-button"
          onClick={clearFilters}
          type="button"
        >
          Limpiar filtros
        </button>
      </div>

      {loading && (
        <div className="tickets-message">
          Cargando tickets...
        </div>
      )}

      {error && (
        <div className="tickets-message tickets-error" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="tickets-list-card">
          <div className="tickets-list-heading">
            <div>
              <h3>Listado de solicitudes</h3>
              <span>
                {filteredTickets.length} de {tickets.length} tickets
              </span>
            </div>
          </div>

          {filteredTickets.length === 0 ? (
            <div className="tickets-empty">
              <h3>No se encontraron tickets</h3>
              <p>
                Prueba modificando los términos de búsqueda o los filtros.
              </p>
              <button onClick={clearFilters} type="button">
                Limpiar búsqueda
              </button>
            </div>
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
                    <th>Fecha de creación</th>
                    <th>Acción</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td className="ticket-id">#{ticket.id}</td>

                      <td className="ticket-subject">
                        <strong>{ticket.title}</strong>
                        <span>{ticket.description}</span>
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

                      <td>
                        <button
                          className="view-ticket-button"
                          type="button"
                          onClick={() => navigate(`/tickets/${ticket.id}`)}
                        >
                          Ver detalles →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
