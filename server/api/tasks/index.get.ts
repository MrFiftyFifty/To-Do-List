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

export default defineEventHandler((event) => {
  const user = getUserFromEvent(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const query = getQuery(event)
  const page = Math.max(1, Number(query.page || '1') || 1)
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize || '10') || 10))
  const q = String(query.q || '').trim().toLowerCase()
  const sortBy = String(query.sortBy || 'createdAt')
  const sortOrder = String(query.sortOrder || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC'
  const quick = String(query.quick || '')
  const authorIdParam = query.authorId ? String(query.authorId) : null
  const createdFrom = query.createdFrom ? String(query.createdFrom) : null
  const createdTo = query.createdTo ? String(query.createdTo) : null

  const conditions: string[] = []
  const params: unknown[] = []

  if (q) {
    conditions.push('(LOWER(Title) LIKE ? OR LOWER(Description) LIKE ?)')
    params.push(`%${q}%`, `%${q}%`)
  }

  if (quick === 'completed') {
    conditions.push('IsCompleted = 1')
  } else if (quick === 'active') {
    conditions.push('IsCompleted = 0 AND DATE(DueDate) >= DATE(?)')
    params.push(new Date().toISOString().slice(0, 10))
  } else if (quick === 'overdue') {
    conditions.push('IsCompleted = 0 AND DATE(DueDate) < DATE(?)')
    params.push(new Date().toISOString().slice(0, 10))
  }

  if (authorIdParam) {
    const aid = Number(authorIdParam)
    if (!Number.isNaN(aid)) {
      conditions.push('CreatedBy = ?')
      params.push(aid)
    }
  }

  if (createdFrom) {
    conditions.push('CreatedAt >= ?')
    params.push(createdFrom)
  }
  if (createdTo) {
    conditions.push('CreatedAt <= ?')
    params.push(createdTo)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const sortColumnMap: Record<string, string> = {
    title: 'Title',
    dueDate: 'DueDate',
    status: 'IsCompleted',
    createdAt: 'CreatedAt',
  }
  const sortColumn = sortColumnMap[sortBy] || 'CreatedAt'

  const db = useDb()

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM tasks ${where}`).get(...params) as { total: number }
  const total = countRow.total

  const offset = (page - 1) * pageSize
  const rows = db
    .prepare(`SELECT * FROM tasks ${where} ORDER BY ${sortColumn} ${sortOrder} LIMIT ? OFFSET ?`)
    .all(...params, pageSize, offset) as TaskRow[]

  const data = rows.map(r => ({
    Id: r.Id,
    Title: r.Title,
    Description: r.Description,
    DueDate: r.DueDate,
    IsCompleted: Boolean(r.IsCompleted),
    CreatedBy: r.CreatedBy,
    CreatedAt: r.CreatedAt,
  }))

  return {
    data,
    meta: { total, page, pageSize },
  }
})
