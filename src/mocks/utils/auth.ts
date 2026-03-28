import { users } from '../data/users.data'

export function getUserFromAuthHeader(auth?: string | null) {
  if (!auth) return null
  const token = auth.replace(/^Bearer\s+/i, '')
  const userId = Number(token)
  if (Number.isNaN(userId)) return null
  return users.find(u => u.id === userId) || null
}
