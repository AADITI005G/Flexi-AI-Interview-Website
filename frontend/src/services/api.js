import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL,
  // Guard against hung requests to keep UI responsive
  timeout: 15000,
  // Only treat 2xx as success. Axios defaults to this, explicit for clarity.
  validateStatus: (status) => status >= 200 && status < 300,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error || {}

    // Auto-logout on 401 to avoid broken sessions
    if (response && response.status === 401) {
      try {
        localStorage.removeItem('token')
      } catch {}
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }

    // Lightweight retry for 429 rate-limits (once with jitter)
    if (response && response.status === 429 && config && !config.__retry) {
      config.__retry = true
      const jitterMs = 300 + Math.floor(Math.random() * 500)
      await new Promise((resolve) => setTimeout(resolve, jitterMs))
      return api(config)
    }

    return Promise.reject(error)
  }
)

export default api