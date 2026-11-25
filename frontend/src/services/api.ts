
const API_URL = 'http://127.0.0.1:8000'

export interface LoginResponse {
  access_token: string
  token_type: string
}

export interface UserProfile {
  id: number
  client_id: number | null
  role_id: number
  full_name: string
  email: string
  is_active: boolean
}

export interface TicketStatistics {
  total: number
  open: number
  in_progress: number
  resolved: number
  closed: number
  unassigned: number
  priority: {
    low: number
    medium: number
    high: number
  }
}

export interface Ticket {
  id: number
  client_id: number
  created_by: number
  assigned_to: number | null
  title: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high'
  created_at: string
  updated_at: string
}

export interface TicketEvent {
  id: number
  ticket_id: number
  actor_id: number
  event_type: string
  old_value: string | null
  new_value: string | null
  created_at: string
}

// Tipos para las operaciones de tickets
export type TicketCreate = {
  title: string
  description: string
  priority: Ticket['priority']
}

export type TicketAssignment = {
  technician_id: number
}

export type TicketStatusUpdate = {
  status: Ticket['status']
}

// Iniciar sesión y obtener el token JWT
export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const formData = new URLSearchParams()

  formData.append('username', email)
  formData.append('password', password)

  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'No se pudo iniciar sesión')
  }

  return response.json()
}

// Obtener el perfil del usuario autenticado
export async function getProfile(
  token: string,
): Promise<UserProfile> {
  const response = await fetch(`${API_URL}/profile/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('No se pudo obtener el perfil del usuario')
  }

  return response.json()
}

// Obtener estadísticas de tickets del usuario autenticado
export async function getTicketStatistics(
  token: string,
): Promise<TicketStatistics> {
  const response = await fetch(`${API_URL}/tickets/stats/summary`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('No se pudieron obtener las estadísticas de tickets')
  }

  return response.json()
}

// Obtener tickets del usuario autenticado
export async function getTickets(
  token: string,
): Promise<Ticket[]> {
  const response = await fetch(`${API_URL}/tickets/`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('No se pudieron obtener los tickets')
  }

  return response.json()
}

// Obtener los detalles de un ticket específico
export async function getTicketById(
  token: string,
  ticketId: number,
): Promise<Ticket> {
  const response = await fetch(`${API_URL}/tickets/${ticketId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('No se pudieron obtener los detalles del ticket')
  }

  return response.json()
}

// Obtener el historial de un ticket
export async function getTicketHistory(
  token: string,
  ticketId: number,
): Promise<TicketEvent[]> {
  const response = await fetch(`${API_URL}/tickets/${ticketId}/history`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    throw new Error('No se pudo obtener el historial del ticket')
  }

  return response.json()
}

// Crear un nuevo ticket
export async function createTicket(
  token: string,
  data: TicketCreate,
): Promise<Ticket> {
  const response = await fetch(`${API_URL}/tickets/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'No se pudo crear el ticket')
  }

  return response.json()
}

// Asignar un técnico a un ticket
export async function assignTicket(
  token: string,
  ticketId: number,
  technicianId: number,
): Promise<Ticket> {
  const response = await fetch(`${API_URL}/tickets/${ticketId}/assign`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      technician_id: technicianId,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'No se pudo asignar el técnico')
  }

  return response.json()
}

// Actualizar el estado de un ticket
export async function updateTicketStatus(
  token: string,
  ticketId: number,
  status: Ticket['status'],
): Promise<Ticket> {
  const response = await fetch(`${API_URL}/tickets/${ticketId}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.detail || 'No se pudo actualizar el estado')
  }

  return response.json()
}

