
import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Login.css'

export default function Login() {
  const { user, signIn } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await signIn(email, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo iniciar sesión',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-brand">
        <div className="brand-content">
          <div className="brand-logo">N</div>
          <h1>Nexo TI</h1>
          <p className="brand-subtitle">
            Sistema de gestión de soporte técnico
          </p>

          <div className="brand-message">
            <span className="brand-line" />
            <h2>La tecnología conecta. Nosotros resolvemos.</h2>
            <p>
              Gestiona solicitudes, coordina equipos técnicos y
              mantén el control de tus servicios desde un solo lugar.
            </p>
          </div>

          <p className="brand-footer">
            Plataforma de soporte técnico empresarial
          </p>
        </div>
      </section>

      <section className="login-form-section">
        <div className="login-card">
          <div className="mobile-brand">
            <div className="brand-logo">N</div>
            <span>Nexo TI</span>
          </div>

          <span className="login-eyebrow">BIENVENIDO</span>
          <h2>Inicia sesión</h2>
          <p className="login-description">
            Ingresa tus credenciales para acceder a tu cuenta.
          </p>

          <form onSubmit={handleSubmit}>
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              placeholder="usuario@empresa.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              required
            />

            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />

            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            <button type="submit" disabled={submitting}>
              {submitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
              {!submitting && <span>→</span>}
            </button>
          </form>

          <div className="login-security">
            <span>●</span>
            Acceso seguro a la plataforma
          </div>

          <p className="login-copyright">
            © 2026 Nexo TI. Todos los derechos reservados.
          </p>
        </div>
      </section>
    </main>
  )
}
