import { useEffect, useState } from 'react'
import api from '../services/api'

export default function Dashboard() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function fetchHistory() {
    try {
      setLoading(true)
      setError('')
      const res = await api.get(`/interview/history?limit=50`)
      const data = res.data
      setHistory(Array.isArray(data?.history) ? data.history : [])
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to fetch history'
      setError(msg)
      setHistory([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  return (
    <div className="authed-page theme-brick theme-brick-page">
      <div className="container">
        <div className="card">
          <div className="card-header">
            <h2>Dashboard</h2>
            <button className="btn btn-ghost" onClick={fetchHistory} disabled={loading}>
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
          <p className="muted">Your past sessions: questions answered and marks received.</p>
          {error ? <div className="alert alert-error">{error}</div> : null}
          {loading ? (
            <div className="skeleton-list">
              <div className="skeleton" />
              <div className="skeleton" />
              <div className="skeleton" />
            </div>
          ) : history.length === 0 ? (
            <div className="empty">No sessions yet. Answer a question to see history here.</div>
          ) : (
            <ul className="list list-compact">
              {history.map((h) => (
                <li key={h._id || `${h.timestamp}-${h.question?.slice(0,20)}`} className="list-item">
                  <div className="list-item-main">
                    <div className="list-inline">
                      <span className="badge">{h.topic || 'General'}</span>
                      <span className="muted">{new Date(h.timestamp || h.createdAt || Date.now()).toLocaleString()}</span>
                    </div>
                    <div className="title">{h.question || '—'}</div>
                    {h.answer ? (
                      <div className="muted">Your answer: {String(h.answer).length > 180 ? `${String(h.answer).slice(0,180)}…` : String(h.answer)}</div>
                    ) : null}
                  </div>
                  <div className="list-item-meta">
                    <div className="score" style={{ fontWeight: 600, color: (typeof h.score === 'number' && h.score < 0) ? '#ff6b6b' : 'inherit' }}>
                      {typeof h.score === 'number'
                        ? (h.score < 0 ? `Penalty: ${h.score}` : `Score: ${h.score}/5`)
                        : (h.score ?? '—')}
                    </div>
                    {h.feedback ? (
                      <div className="muted">Feedback: {String(h.feedback).length > 120 ? `${String(h.feedback).slice(0,120)}…` : String(h.feedback)}</div>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}