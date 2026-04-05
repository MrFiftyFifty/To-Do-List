import { useDb } from '../../utils/db'
import { getUserFromEvent } from '../../utils/auth'

export default defineEventHandler((event) => {
  const user = getUserFromEvent(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const id = Number(getRouterParam(event, 'id'))
  if (Number.isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  }

  const db = useDb()
  const task = db.prepare('SELECT Id, CreatedBy FROM tasks WHERE Id = ?').get(id) as
    | { Id: number; CreatedBy: number }
    | undefined

  if (!task) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  if (user.role !== 'admin' && task.CreatedBy !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  db.prepare('DELETE FROM tasks WHERE Id = ?').run(id)

  setResponseStatus(event, 204)
  return null
})
