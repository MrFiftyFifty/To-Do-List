import type { Task } from '~/types/task'

export let tasks: Task[] = [
  {
    Id: 1,
    Title: 'Сделать логин',
    Description: 'Форма email/password',
    DueDate: '2026-02-15',
    IsCompleted: false,
    CreatedBy: 1,
    CreatedAt: '2026-01-10T10:00:00.000Z',
  },
  {
    Id: 2,
    Title: 'Список задач',
    Description: 'Фильтрация и сортировка',
    DueDate: '2026-02-18',
    IsCompleted: true,
    CreatedBy: 2,
    CreatedAt: '2026-01-11T14:30:00.000Z',
  },
  {
    Id: 3,
    Title: 'Чужая задача пользователя',
    Description: 'Видна user2',
    DueDate: '2026-03-01',
    IsCompleted: false,
    CreatedBy: 2,
    CreatedAt: '2026-01-12T09:00:00.000Z',
  },
]
