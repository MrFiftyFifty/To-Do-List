export const AUTH_TOKEN_COOKIE_NAME = 'token'

export const authTokenCookieOpts = {
  path: '/',
  maxAge: 60 * 60 * 24 * 30,
  sameSite: 'lax' as const,
}
