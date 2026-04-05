import axios from 'axios'
import { AUTH_TOKEN_COOKIE_NAME, authTokenCookieOpts } from '~/utils/authCookie'

export default defineNuxtPlugin(() => {
  const tokenCookie = useCookie<string | null>(AUTH_TOKEN_COOKIE_NAME, authTokenCookieOpts)
  const config = useRuntimeConfig()
  const api = axios.create({
    baseURL: config.public.apiBase as string,
  })

  api.interceptors.request.use(cfg => {
    if (import.meta.client) {
      const token = localStorage.getItem('token')
      if (token) {
        cfg.headers.Authorization = `Bearer ${token}`
      }
    }
    return cfg
  })

  api.interceptors.response.use(
    r => r,
    error => {
      if (import.meta.client && error.response?.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        tokenCookie.value = null
        navigateTo('/login')
      }
      return Promise.reject(error)
    },
  )

  return {
    provide: {
      api,
    },
  }
})
