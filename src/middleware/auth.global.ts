import { AUTH_TOKEN_COOKIE_NAME, authTokenCookieOpts } from '~/utils/authCookie'

export default defineNuxtRouteMiddleware(to => {
  const tokenCookie = useCookie<string | null>(AUTH_TOKEN_COOKIE_NAME, authTokenCookieOpts)
  let token = tokenCookie.value ?? null
  if (import.meta.client && !token) {
    const fromStorage = localStorage.getItem('token')
    if (fromStorage) {
      token = fromStorage
      tokenCookie.value = fromStorage
    }
  }
  if (to.path === '/login') {
    if (token) {
      return navigateTo('/')
    }
    return
  }
  if (!token) {
    return navigateTo('/login')
  }
})
