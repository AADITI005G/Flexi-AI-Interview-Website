import { Routes, Route, Link, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Signup from './pages/Signup'
import Login from './pages/Login'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import { useAuth } from './context/AuthContext'

export default function App() {
  const { user, logout } = useAuth()
  return (
    <div className="theme-brick-root">
      <nav className="nav">
        <div className="nav-inner">
          <Link className="brand brand-dark" to="/">AI Interview Coach</Link>
          {user ? (
            <Link to="/dashboard">Dashboard</Link>
          ) : null}
          <div className="spacer" />
          {user ? (
            <div className="toolbar">
              <span className="muted">Hi, {user.name}</span>
              <button className="btn btn-ghost" onClick={logout}>Logout</button>
            </div>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/signup">Signup</Link>
            </>
          )}
        </div>
      </nav>
      <div className="container">
        <div className="hero">
          <h1 className="hero-title text-gradient-btn">Practice smarter with dynamic AI questions</h1>
          <p className="muted">Fresh prompts and instant feedback — all in one place.</p>
        </div>
        <Routes>
          <Route element={<ProtectedRoute />}> 
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Route>
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          <Route path="/signup" element={user ? <Navigate to="/" /> : <Signup />} />
        </Routes>
      </div>
    </div>
  )
}