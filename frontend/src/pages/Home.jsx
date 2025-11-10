import { useEffect, useState } from 'react'
import api from '../services/api'

export default function Home() {
  const [topics, setTopics] = useState([])
  const [topic, setTopic] = useState('')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState('')
  const [score, setScore] = useState(null)
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [loadingQuestion, setLoadingQuestion] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.get('/interview/topics').then(res => {
      setTopics(res.data.topics || [])
      setTopic(res.data.topics?.[0] || '')
    })
  }, [])

  // Load history whenever topic changes or after initial topic set
  useEffect(() => {
    if (!topic) return
    fetchHistory()
  }, [topic])

  const getQuestion = async () => {
    try {
      setLoadingQuestion(true)
      const res = await api.post('/interview/ask', { topic })
      setQuestion(res.data.question)
      setFeedback('')
      setScore(null)
      setAnswer('')
    } catch (err) {
      const msg = err?.response?.data?.message || err.message
      setFeedback(`Failed to get question: ${msg}`)
    } finally {
      setLoadingQuestion(false)
    }
  }

  const submitAnswer = async () => {
    try {
      setSubmitting(true)
      const res = await api.post('/interview/ask', { topic, question, answer })
      setFeedback(res.data.feedback)
      setScore(res.data.score)
      setQuestion(res.data.nextQuestion)
      setAnswer('')
      // refresh history after submission
      fetchHistory()
    } catch (err) {
      const msg = err?.response?.data?.message || err.message
      setFeedback(`Failed to submit answer: ${msg}`)
    } finally {
      setSubmitting(false)
    }
  }

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true)
      const params = new URLSearchParams()
      params.set('limit', '10')
      if (topic) params.set('topic', topic)
      const res = await api.get(`/interview/history?${params.toString()}`)
      setHistory(res.data.history || [])
    } catch (_) {
      setHistory([])
    } finally {
      setLoadingHistory(false)
    }
  }

  return (
    <div className="authed-page theme-brick theme-brick-page">
      <div className="grid">
      <div className="card">
        <h2>Practice Setup</h2>
        <p className="muted">Choose a topic and fetch a question.</p>
        <div className="stack">
          <div className="field">
            <label>Topic</label>
            <select className="select" value={topic} onChange={e => setTopic(e.target.value)}>
              {topics.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <button className="btn btn-primary" onClick={getQuestion} disabled={loadingQuestion}>
              {loadingQuestion ? 'Loading…' : '✨ Get Question'}
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Answer & Feedback</h2>
        {!question ? (
          <p className="muted">Click "Get Question" to start.</p>
        ) : (
          <>
            <h3>Question</h3>
            <p>{question}</p>
            <textarea className="textarea" rows={6} value={answer} onChange={e => setAnswer(e.target.value)} />
            <div className="stack" style={{ marginTop: 8, alignItems: 'center' }}>
              <button className="btn btn-primary" onClick={submitAnswer} disabled={!answer}>🚀 Submit Answer</button>
              {submitting && <span className="muted" style={{ marginLeft: 8 }}>Submitting…</span>}
            </div>
            {feedback && (
              <div style={{ marginTop: 12 }}>
                <h3>Feedback</h3>
                <p>{feedback}</p>
                {score !== null && (
                  <p style={{ fontWeight: 600, color: score < 0 ? '#ff6b6b' : 'inherit' }}>
                    {score < 0 ? `Penalty: ${score}` : `Score: ${score}/5`}
                  </p>
                )}
                <p className="muted" style={{ fontSize: 13 }}>
                  Evaluation considers multiple criteria (clarity, correctness, complexity, trade-offs, examples, real-world application).
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="card">
        <h2>Recent Sessions</h2>
        <p className="muted">Last 10 entries{topic ? ` for ${topic}` : ''}.</p>
        {loadingHistory ? (
          <p className="muted">Loading history…</p>
        ) : history.length === 0 ? (
          <p className="muted">No history yet. Submit an answer to see entries here.</p>
        ) : (
          <div className="stack">
            {history.map((h, i) => (
              <div key={`${h._id || i}-${h.createdAt || i}`} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="muted" style={{ fontWeight: 600 }}>Score: {typeof h.score === 'number' ? `${h.score}/5` : '—'}</span>
                  <span className="muted">{h.createdAt ? new Date(h.createdAt).toLocaleString() : ''}</span>
                </div>
                <div style={{ marginTop: 6 }}>
                  <div style={{ fontWeight: 600 }}>Q:</div>
                  <div style={{ opacity: 0.95 }}>{h.question}</div>
                </div>
                {h.feedback && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ fontWeight: 600 }}>Feedback:</div>
                    <div className="muted" style={{ opacity: 0.95 }}>{h.feedback}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <div style={{ marginTop: 10 }}>
          <button className="btn btn-ghost" onClick={fetchHistory}>↻ Refresh</button>
        </div>
      </div>
      </div>
    </div>
  )
}