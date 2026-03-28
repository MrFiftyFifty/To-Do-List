import { http, HttpResponse, delay } from 'msw'
import { users } from '../data/users.data'

export const authHandlers = [
  http.post('/api/auth/login', async ({ request }) => {
    await delay(400)
    let body: { email?: string; password?: string }
    try {
      body = (await request.json()) as { email?: string; password?: string }
    } catch {
      return HttpResponse.json({ message: 'Invalid JSON' }, { status: 400 })
    }
    const email = body.email?.trim()
    const password = body.password
    if (!email || !password) {
      return HttpResponse.json({ message: 'Email and password required' }, { status: 400 })
    }
    const user = users.find(u => u.email === email && u.password === password)
    if (!user) {
      return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 })
    }
    return HttpResponse.json({
      token: String(user.id),
      user: { id: user.id, email: user.email, role: user.role },
    })
  }),
]
