import { createContext, useContext, useEffect, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token') || '')

  useEffect(() => {
    if (!token) return
    api.get('/auth/me')
      .then(res => setUser(res.data))
      .catch(() => {
        setUser(null)
        setToken('')
        localStorage.removeItem('token')
      })
  }, [token])

  const signup = async ({ name, email, password }) => {
    const res = await api.post('/auth/signup', { name, email, password })
    setUser({ _id: res.data._id, name: res.data.name, email: res.data.email })
    setToken(res.data.token)
    localStorage.setItem('token', res.data.token)
  }

  const login = async ({ email, password }) => {
    const res = await api.post('/auth/login', { email, password })
    setUser({ _id: res.data._id, name: res.data.name, email: res.data.email })
    setToken(res.data.token)
    localStorage.setItem('token', res.data.token)
  }

  const logout = () => {
    setUser(null)
    setToken('')
    localStorage.removeItem('token')
  }

  return (
    <AuthContext.Provider value={{ user, token, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)