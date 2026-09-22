import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('qaforge-token')

    if (!token) {
      setLoading(false)
      return
    }

    api
      .get('/auth/me')
      .then((response) => {
        setUser(response.data.user)
      })
      .catch(() => {
        localStorage.removeItem('qaforge-token')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password })
    const { token, user: loggedInUser } = response.data

    localStorage.setItem('qaforge-token', token)
    setUser(loggedInUser)

    return response.data
  }

  const logout = () => {
    localStorage.removeItem('qaforge-token')
    setUser(null)
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      isAuthenticated: Boolean(user),
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
