import { useDb } from '../../utils/db'
import { getUserFromEvent } from '../../utils/auth'

interface TaskRow {
  Id: number
  Title: string
  Description: string
  DueDate: string
  IsCompleted: number
  CreatedBy: number
  CreatedAt: string
}

export default defineEventHandler(async (event) => {
  const user = getUserFromEvent(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const id = Number(getRouterParam(event, 'id'))
  if (Number.isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid id' })
  }

  const db = useDb()
  const task = db.prepare('SELECT * FROM tasks WHERE Id = ?').get(id) as TaskRow | undefined
  if (!task) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  if (user.role !== 'admin' && task.CreatedBy !== user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  const body = await readBody<Record<string, unknown>>(event)
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid JSON' })
  }

  const title = typeof body.Title === 'string' ? body.Title.trim() : ''
  const description = typeof body.Description === 'string' ? body.Description : ''
  const dueDate = typeof body.DueDate === 'string' ? body.DueDate : ''
  const isCompleted = Boolean(body.IsCompleted)

  if (!title) {
    throw createError({ statusCode: 400, statusMessage: 'Title is required' })
  }
  if (!dueDate || Number.isNaN(Date.parse(dueDate))) {
    throw createError({ statusCode: 400, statusMessage: 'Valid DueDate is required' })
  }

  db.prepare('UPDATE tasks SET Title = ?, Description = ?, DueDate = ?, IsCompleted = ? WHERE Id = ?').run(
    title,
    description,
    dueDate.slice(0, 10),
    isCompleted ? 1 : 0,
    id,
  )

  return {
    Id: id,
    Title: title,
    Description: description,
    DueDate: dueDate.slice(0, 10),
    IsCompleted: isCompleted,
    CreatedBy: task.CreatedBy,
    CreatedAt: task.CreatedAt,
  }
})
