import type { H3Event } from 'h3'
import { verifyJwt } from './jwt'
import { useDb } from './db'

export function getUserFromEvent(event: H3Event) {
  const auth = getHeader(event, 'authorization')
  if (!auth) return null

  const token = auth.replace(/^Bearer\s+/i, '')
  const payload = verifyJwt(token)
  if (!payload || typeof payload.id !== 'number') return null

  const db = useDb()
  const user = db.prepare('SELECT id, email, role FROM users WHERE id = ?').get(payload.id) as
    | { id: number; email: string; role: string }
    | undefined

  if (!user) return null
  return { id: user.id, email: user.email, role: user.role }
}
