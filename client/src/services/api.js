import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
})

let activeProjectKey = null

export const setActiveProjectKey = (projectKey) => {
  activeProjectKey = projectKey || null
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('qaforge-token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  if (activeProjectKey) {
    config.headers = config.headers || {}
    if (!config.headers['X-Project-Key']) {
      config.headers['X-Project-Key'] = activeProjectKey
    }
  }

  return config
})

export default api
