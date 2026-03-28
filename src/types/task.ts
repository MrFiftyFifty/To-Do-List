export interface Task {
  Id: number
  Title: string
  Description: string
  DueDate: string
  IsCompleted: boolean
  CreatedBy: number
  CreatedAt: string
}

export interface TasksListResponse {
  data: Task[]
  meta: {
    total: number
    page: number
    pageSize: number
  }
}

export interface LoginResponse {
  token: string
  user: {
    id: number
    email: string
    role: 'admin' | 'user'
  }
}
