import { useDb } from '../../utils/db'
import { getUserFromEvent } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = getUserFromEvent(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
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

  const db = useDb()
  const createdAt = new Date().toISOString()

  const result = db
    .prepare(
      'INSERT INTO tasks (Title, Description, DueDate, IsCompleted, CreatedBy, CreatedAt) VALUES (?, ?, ?, ?, ?, ?)',
    )
    .run(title, description, dueDate.slice(0, 10), isCompleted ? 1 : 0, user.id, createdAt)

  setResponseStatus(event, 201)
  return {
    Id: result.lastInsertRowid as number,
    Title: title,
    Description: description,
    DueDate: dueDate.slice(0, 10),
    IsCompleted: isCompleted,
    CreatedBy: user.id,
    CreatedAt: createdAt,
  }
})
