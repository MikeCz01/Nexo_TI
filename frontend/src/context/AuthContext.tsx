
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import {
  login as loginRequest,
  getProfile,
  type UserProfile,
} from '../services/api'

interface AuthContextType {
  user: UserProfile | null
  token: string | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('nexoti_token'),
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function restoreSession() {
      if (!token) {
        setLoading(false)
        return
      }

      try {
        const profile = await getProfile(token)
        setUser(profile)
      } catch {
        localStorage.removeItem('nexoti_token')
        setToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    restoreSession()
  }, [token])

  async function signIn(email: string, password: string) {
    const result = await loginRequest(email, password)

    localStorage.setItem('nexoti_token', result.access_token)
    setToken(result.access_token)

    const profile = await getProfile(result.access_token)
    setUser(profile)
  }

  function signOut() {
    localStorage.removeItem('nexoti_token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, token, loading, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth debe utilizarse dentro de AuthProvider')
  }

  return context
}
