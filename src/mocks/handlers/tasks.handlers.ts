import { http, HttpResponse, delay } from 'msw'
import type { Task } from '~/types/task'
import { tasks as taskStore } from '../data/tasks.data'
import { getUserFromAuthHeader } from '../utils/auth'

let lastId = Math.max(0, ...taskStore.map(t => t.Id))

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x.getTime()
}

function isOverdue(t: Task): boolean {
  if (t.IsCompleted) return false
  const due = startOfDay(new Date(t.DueDate))
  const today = startOfDay(new Date())
  return due < today
}

function canModify(user: { id: number; role: string }, task: Task) {
  return user.role === 'admin' || task.CreatedBy === user.id
}

export const taskHandlers = [
  http.get('/api/tasks', async ({ request }) => {
    await delay(350)
    const user = getUserFromAuthHeader(request.headers.get('authorization'))
    if (!user) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    const url = new URL(request.url)
    const page = Math.max(1, Number(url.searchParams.get('page') || '1') || 1)
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') || '10') || 10))
    const q = (url.searchParams.get('q') || '').trim().toLowerCase()
    const sortBy = url.searchParams.get('sortBy') || 'createdAt'
    const sortOrder = (url.searchParams.get('sortOrder') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc'
    const quick = url.searchParams.get('quick') || ''
    const authorIdParam = url.searchParams.get('authorId')
    const createdFrom = url.searchParams.get('createdFrom')
    const createdTo = url.searchParams.get('createdTo')

    let list = [...taskStore]

    if (q) {
      list = list.filter(
        t =>
          t.Title.toLowerCase().includes(q) ||
          (t.Description && t.Description.toLowerCase().includes(q)),
      )
    }

    if (quick === 'completed') {
      list = list.filter(t => t.IsCompleted)
    } else if (quick === 'active') {
      list = list.filter(t => !t.IsCompleted && !isOverdue(t))
    } else if (quick === 'overdue') {
      list = list.filter(t => !t.IsCompleted && isOverdue(t))
    }

    if (authorIdParam) {
      const aid = Number(authorIdParam)
      if (!Number.isNaN(aid)) {
        list = list.filter(t => t.CreatedBy === aid)
      }
    }

    if (createdFrom) {
      const from = new Date(createdFrom).getTime()
      list = list.filter(t => new Date(t.CreatedAt).getTime() >= from)
    }
    if (createdTo) {
      const to = new Date(createdTo).getTime()
      list = list.filter(t => new Date(t.CreatedAt).getTime() <= to)
    }

    const dir = sortOrder === 'asc' ? 1 : -1
    list.sort((a, b) => {
      let cmp = 0
      if (sortBy === 'title') {
        cmp = a.Title.localeCompare(b.Title, 'ru')
      } else if (sortBy === 'dueDate') {
        cmp = new Date(a.DueDate).getTime() - new Date(b.DueDate).getTime()
      } else if (sortBy === 'status') {
        cmp = Number(a.IsCompleted) - Number(b.IsCompleted)
      } else {
        cmp = new Date(a.CreatedAt).getTime() - new Date(b.CreatedAt).getTime()
      }
      return cmp * dir
    })

    const total = list.length
    const start = (page - 1) * pageSize
    const data = list.slice(start, start + pageSize)

    return HttpResponse.json({
      data,
      meta: { total, page, pageSize },
    })
  }),

  http.post('/api/tasks', async ({ request }) => {
    await delay(300)
    const user = getUserFromAuthHeader(request.headers.get('authorization'))
    if (!user) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    let body: Record<string, unknown>
    try {
      body = (await request.json()) as Record<string, unknown>
    } catch {
      return HttpResponse.json({ message: 'Invalid JSON' }, { status: 400 })
    }
    const title = typeof body.Title === 'string' ? body.Title.trim() : ''
    const description = typeof body.Description === 'string' ? body.Description : ''
    const dueDate = typeof body.DueDate === 'string' ? body.DueDate : ''
    const isCompleted = Boolean(body.IsCompleted)
    if (!title) {
      return HttpResponse.json({ message: 'Title is required' }, { status: 400 })
    }
    if (!dueDate || Number.isNaN(Date.parse(dueDate))) {
      return HttpResponse.json({ message: 'Valid DueDate is required' }, { status: 400 })
    }
    const task: Task = {
      Id: ++lastId,
      Title: title,
      Description: description,
      DueDate: dueDate.slice(0, 10),
      IsCompleted: isCompleted,
      CreatedBy: user.id,
      CreatedAt: new Date().toISOString(),
    }
    taskStore.push(task)
    return HttpResponse.json(task, { status: 201 })
  }),

  http.put('/api/tasks/:id', async ({ request, params }) => {
    await delay(300)
    const user = getUserFromAuthHeader(request.headers.get('authorization'))
    if (!user) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    const id = Number(params.id)
    if (Number.isNaN(id)) {
      return HttpResponse.json({ message: 'Invalid id' }, { status: 400 })
    }
    const task = taskStore.find(t => t.Id === id)
    if (!task) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    }
    if (!canModify(user, task)) {
      return HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
    }
    let body: Record<string, unknown>
    try {
      body = (await request.json()) as Record<string, unknown>
    } catch {
      return HttpResponse.json({ message: 'Invalid JSON' }, { status: 400 })
    }
    const title = typeof body.Title === 'string' ? body.Title.trim() : ''
    const description = typeof body.Description === 'string' ? body.Description : ''
    const dueDate = typeof body.DueDate === 'string' ? body.DueDate : ''
    const isCompleted = Boolean(body.IsCompleted)
    if (!title) {
      return HttpResponse.json({ message: 'Title is required' }, { status: 400 })
    }
    if (!dueDate || Number.isNaN(Date.parse(dueDate))) {
      return HttpResponse.json({ message: 'Valid DueDate is required' }, { status: 400 })
    }
    task.Title = title
    task.Description = description
    task.DueDate = dueDate.slice(0, 10)
    task.IsCompleted = isCompleted
    return HttpResponse.json(task)
  }),

  http.delete('/api/tasks/:id', async ({ request, params }) => {
    await delay(250)
    const user = getUserFromAuthHeader(request.headers.get('authorization'))
    if (!user) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }
    const id = Number(params.id)
    if (Number.isNaN(id)) {
      return HttpResponse.json({ message: 'Invalid id' }, { status: 400 })
    }
    const idx = taskStore.findIndex(t => t.Id === id)
    if (idx === -1) {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    }
    const task = taskStore[idx]
    if (!task || !canModify(user, task)) {
      return HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
    }
    taskStore.splice(idx, 1)
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('/api/_msw/test-500', () => {
    return HttpResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }),
]
