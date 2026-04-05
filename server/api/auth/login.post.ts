import { useDb } from '../../utils/db'
import { signJwt } from '../../utils/jwt'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; password?: string }>(event)

  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid JSON' })
  }

  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Email and password required' })
  }

  const db = useDb()
  const user = db
    .prepare('SELECT id, email, role FROM users WHERE email = ? AND password = ?')
    .get(email, password) as { id: number; email: string; role: string } | undefined

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  const token = signJwt({ id: user.id, email: user.email, role: user.role })

  return {
    token,
    user: { id: user.id, email: user.email, role: user.role },
  }
})
