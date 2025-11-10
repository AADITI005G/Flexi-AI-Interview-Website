import { useEffect, useState } from 'react'
import PixelCanvasOverlay from '../components/PixelCanvasOverlay'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  // Harmonize nav brand with Login page theme by applying brick variables at root
  useEffect(() => {
    document.body.classList.add('theme-brick-root')
    return () => {
      document.body.classList.remove('theme-brick-root')
    }
  }, [])

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await login(form)
      navigate('/')
    } catch (err) {
      setError(err?.response?.data?.message || err.message)
    }
  }

  return (
    <div className="theme-brick theme-brick-page">
      <PixelCanvasOverlay tileSize={16} speed={{ x: 32, y: 16 }} />
      <div className="container" style={{ maxWidth: 720 }}>
        <div className="card">
          <h2>Welcome back</h2>
          <p className="muted">Log in to continue practicing interviews.</p>
        {error && <p className="error">{error}</p>}
          <form onSubmit={onSubmit} className="stack">
            <div className="field">
              <label>Email</label>
              <input className="input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="field">
              <label>Password</label>
              <input className="input" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <button className="btn btn-primary" type="submit">Login</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}