<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-white">Задачи</h1>
        <p class="text-sm text-slate-400">Сортировка, фильтры, поиск и пагинация</p>
      </div>
      <button
        type="button"
        class="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        @click="openCreate"
      >
        Новая задача
      </button>
    </div>

    <div class="grid gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4 md:grid-cols-2 lg:grid-cols-4">
      <div class="lg:col-span-2">
        <label class="mb-1 block text-xs text-slate-500">Поиск</label>
        <input
          v-model="searchQuery"
          type="search"
          placeholder="Заголовок или описание..."
          class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
        />
      </div>
      <div>
        <label class="mb-1 block text-xs text-slate-500">Быстрый фильтр</label>
        <select
          v-model="quick"
          class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
          @change="onFilterChange"
        >
          <option value="">Все</option>
          <option value="active">Активные</option>
          <option value="completed">Выполненные</option>
          <option value="overdue">Просроченные</option>
        </select>
      </div>
      <div>
        <label class="mb-1 block text-xs text-slate-500">Автор</label>
        <select
          v-model.number="authorId"
          class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
          @change="onFilterChange"
        >
          <option :value="0">Все авторы</option>
          <option v-for="a in authorOptions" :key="a.id" :value="a.id">
            {{ a.label }}
          </option>
        </select>
      </div>
      <div>
        <label class="mb-1 block text-xs text-slate-500">Создано с</label>
        <input
          v-model="createdFrom"
          type="date"
          class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
          @change="onFilterChange"
        />
      </div>
      <div>
        <label class="mb-1 block text-xs text-slate-500">Создано по</label>
        <input
          v-model="createdTo"
          type="date"
          class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
          @change="onFilterChange"
        />
      </div>
      <div>
        <label class="mb-1 block text-xs text-slate-500">Сортировка</label>
        <div class="flex gap-2">
          <select
            v-model="sortBy"
            class="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
            @change="fetchTasks"
          >
            <option value="createdAt">Дата создания</option>
            <option value="dueDate">Дедлайн</option>
            <option value="status">Статус</option>
            <option value="title">Название</option>
          </select>
          <select
            v-model="sortOrder"
            class="w-28 rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-slate-100 outline-none focus:border-emerald-500"
            @change="fetchTasks"
          >
            <option value="desc">По убыв.</option>
            <option value="asc">По возр.</option>
          </select>
        </div>
      </div>
    </div>

    <div
      v-if="loading && !tasks.length"
      class="flex items-center justify-center gap-3 rounded-xl border border-slate-800 bg-slate-900/30 py-20"
    >
      <span class="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      <span class="text-slate-400">Загрузка...</span>
    </div>

    <div
      v-else-if="error"
      class="rounded-xl border border-red-900/50 bg-red-950/30 p-6 text-red-200"
    >
      <p class="font-medium">Ошибка</p>
      <p class="mt-1 text-sm">{{ error }}</p>
      <button
        type="button"
        class="mt-4 rounded-lg border border-red-400/50 px-3 py-1.5 text-sm hover:bg-red-900/40"
        @click="fetchTasks"
      >
        Повторить
      </button>
    </div>

    <div
      v-else-if="!meta.total && !hasActiveFilters"
      class="rounded-xl border border-slate-800 bg-slate-900/30 py-16 text-center text-slate-500"
    >
      Задач пока нет. Создайте первую.
    </div>

    <div
      v-else-if="!tasks.length && hasActiveFilters"
      class="rounded-xl border border-dashed border-slate-700 bg-slate-900/20 py-16 text-center text-slate-400"
    >
      Нет результатов по поиску или фильтрам. Измените запрос.
    </div>

    <div v-else class="overflow-x-auto rounded-xl border border-slate-800">
      <table class="w-full min-w-[720px] text-left text-sm">
        <thead class="border-b border-slate-800 bg-slate-900/80 text-xs uppercase text-slate-500">
          <tr>
            <th class="px-4 py-3">Название</th>
            <th class="px-4 py-3">Дедлайн</th>
            <th class="px-4 py-3">Статус</th>
            <th class="px-4 py-3">Автор</th>
            <th class="px-4 py-3">Создано</th>
            <th class="px-4 py-3 text-right">Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="t in tasks"
            :key="t.Id"
            class="border-b border-slate-800/80 hover:bg-slate-800/40"
          >
            <td class="px-4 py-3 font-medium text-slate-100">{{ t.Title }}</td>
            <td class="px-4 py-3 text-slate-400">{{ formatDate(t.DueDate) }}</td>
            <td class="px-4 py-3">
              <span
                class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                :class="
                  t.IsCompleted
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : isOverdue(t)
                      ? 'bg-red-500/20 text-red-300'
                      : 'bg-slate-600/50 text-slate-200'
                "
              >
                {{
                  t.IsCompleted ? 'Выполнено' : isOverdue(t) ? 'Просрочено' : 'Активна'
                }}
              </span>
            </td>
            <td class="px-4 py-3 text-slate-400">{{ authorLabel(t.CreatedBy) }}</td>
            <td class="px-4 py-3 text-slate-500">{{ formatDateTime(t.CreatedAt) }}</td>
            <td class="px-4 py-3 text-right">
              <div class="flex justify-end gap-2">
                <button
                  v-if="canModify(t)"
                  type="button"
                  class="rounded border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
                  @click="openEdit(t)"
                >
                  Изменить
                </button>
                <button
                  v-if="canModify(t)"
                  type="button"
                  class="rounded border border-red-900/60 px-2 py-1 text-xs text-red-300 hover:bg-red-950/40"
                  @click="confirmDelete(t)"
                >
                  Удалить
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div
        v-if="loading && tasks.length"
        class="flex items-center justify-center gap-2 border-t border-slate-800 py-3 text-xs text-slate-500"
      >
        <span class="h-4 w-4 animate-spin rounded-full border border-emerald-500 border-t-transparent" />
        Обновление...
      </div>
    </div>

    <div v-if="meta.total > 0" class="flex flex-col items-center justify-between gap-4 sm:flex-row">
      <p class="text-sm text-slate-500">
        Всего: {{ meta.total }} · Стр. {{ meta.page }} из {{ totalPages }}
      </p>
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="rounded-lg border border-slate-700 px-3 py-1.5 text-sm disabled:opacity-40"
          :disabled="page <= 1"
          @click="page--; fetchTasks()"
        >
          Назад
        </button>
        <button
          type="button"
          class="rounded-lg border border-slate-700 px-3 py-1.5 text-sm disabled:opacity-40"
          :disabled="page >= totalPages"
          @click="page++; fetchTasks()"
        >
          Вперёд
        </button>
        <select
          v-model.number="pageSize"
          class="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm"
          @change="onPageSizeChange"
        >
          <option :value="5">5 / стр.</option>
          <option :value="10">10 / стр.</option>
          <option :value="20">20 / стр.</option>
        </select>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="modalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        role="dialog"
        aria-modal="true"
        @click.self="closeModal"
      >
        <div
          class="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
          @click.stop
        >
          <h2 class="text-lg font-semibold text-white">
            {{ editingId ? 'Редактировать задачу' : 'Новая задача' }}
          </h2>
          <form class="mt-4 space-y-4" @submit.prevent="saveTask">
            <div>
              <label class="mb-1 block text-xs text-slate-500">Название</label>
              <input
                v-model="form.Title"
                type="text"
                class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label class="mb-1 block text-xs text-slate-500">Описание</label>
              <textarea
                v-model="form.Description"
                rows="3"
                class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs text-slate-500">Дедлайн</label>
              <input
                v-model="form.DueDate"
                type="date"
                class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div class="flex items-center gap-2">
              <input id="done" v-model="form.IsCompleted" type="checkbox" class="rounded border-slate-600" />
              <label for="done" class="text-sm text-slate-300">Выполнено</label>
            </div>
            <p v-if="formError" class="text-sm text-red-400">{{ formError }}</p>
            <div class="flex justify-end gap-2 pt-2">
              <button
                type="button"
                class="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
                @click="closeModal"
              >
                Отмена
              </button>
              <button
                type="submit"
                class="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                :disabled="saving"
              >
                <span
                  v-if="saving"
                  class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                />
                Сохранить
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { watchDebounced } from '@vueuse/core'
import type { Task, TasksListResponse } from '~/types/task'

const { $api } = useNuxtApp()

const authorOptions = [
  { id: 1, label: 'admin@test.com' },
  { id: 2, label: 'user@test.com' },
]

function authorLabel(id: number) {
  return authorOptions.find(a => a.id === id)?.label ?? `#${id}`
}

const user = ref<{ id: number; email: string; role: 'admin' | 'user' } | null>(null)

function loadUser() {
  if (!import.meta.client) return
  const raw = localStorage.getItem('user')
  if (!raw) {
    user.value = null
    return
  }
  try {
    user.value = JSON.parse(raw) as { id: number; email: string; role: 'admin' | 'user' }
  } catch {
    user.value = null
  }
}

function canModify(t: Task) {
  const u = user.value
  if (!u) return false
  if (u.role === 'admin') return true
  return t.CreatedBy === u.id
}

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x.getTime()
}

function isOverdue(t: Task) {
  if (t.IsCompleted) return false
  const due = startOfDay(new Date(t.DueDate))
  const today = startOfDay(new Date())
  return due < today
}

function formatDate(iso: string) {
  if (!iso) return '—'
  const d = new Date(iso.length <= 10 ? `${iso}T12:00:00` : iso)
  return d.toLocaleDateString('ru-RU')
}

function formatDateTime(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('ru-RU')
}

const searchQuery = ref('')
const quick = ref('')
const authorId = ref(0)
const createdFrom = ref('')
const createdTo = ref('')
const sortBy = ref<'createdAt' | 'dueDate' | 'status' | 'title'>('createdAt')
const sortOrder = ref<'asc' | 'desc'>('desc')
const page = ref(1)
const pageSize = ref(10)

const tasks = ref<Task[]>([])
const meta = ref({ total: 0, page: 1, pageSize: 10 })
const loading = ref(true)
const error = ref('')
const saving = ref(false)

const hasActiveFilters = computed(() => {
  return Boolean(
    searchQuery.value.trim() ||
      quick.value ||
      authorId.value ||
      createdFrom.value ||
      createdTo.value,
  )
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(meta.value.total / pageSize.value) || 1),
)

async function fetchTasks() {
  if (import.meta.server) {
    return
  }
  loading.value = true
  error.value = ''
  try {
    const params: Record<string, string | number | undefined> = {
      page: page.value,
      pageSize: pageSize.value,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value,
    }
    const q = searchQuery.value.trim()
    if (q) params.q = q
    if (quick.value) params.quick = quick.value
    if (authorId.value) params.authorId = authorId.value
    if (createdFrom.value) params.createdFrom = new Date(createdFrom.value).toISOString()
    if (createdTo.value) {
      const end = new Date(createdTo.value)
      end.setHours(23, 59, 59, 999)
      params.createdTo = end.toISOString()
    }
    const { data } = await $api.get<TasksListResponse>('/tasks', { params })
    tasks.value = data.data
    meta.value = data.meta
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string }; status?: number } }
    error.value =
      err.response?.data?.message ||
      (err.response?.status === 403 ? 'Нет доступа' : 'Не удалось загрузить задачи')
  } finally {
    loading.value = false
  }
}

function onFilterChange() {
  page.value = 1
  fetchTasks()
}

function onPageSizeChange() {
  page.value = 1
  fetchTasks()
}

watchDebounced(
  searchQuery,
  () => {
    page.value = 1
    fetchTasks()
  },
  { debounce: 400 },
)

const modalOpen = ref(false)
const editingId = ref<number | null>(null)
const form = reactive({
  Title: '',
  Description: '',
  DueDate: '',
  IsCompleted: false,
})
const formError = ref('')

const DRAFT_PREFIX = 'todo-task-form-draft'

watchDebounced(
  [modalOpen, editingId, () => form.Title, () => form.Description, () => form.DueDate, () => form.IsCompleted],
  () => {
    if (!modalOpen.value || !import.meta.client) return
    const key = draftKey()
    if (!key) return
    localStorage.setItem(
      key,
      JSON.stringify({
        Title: form.Title,
        Description: form.Description,
        DueDate: form.DueDate,
        IsCompleted: form.IsCompleted,
      }),
    )
  },
  { debounce: 500 },
)

function draftKey() {
  if (!import.meta.client || !user.value) return null
  const uid = user.value.id
  if (editingId.value === null) {
    return `${DRAFT_PREFIX}:${uid}:create`
  }
  return `${DRAFT_PREFIX}:${uid}:edit:${editingId.value}`
}

function applyDraft() {
  if (!import.meta.client) {
    return
  }
  const key = draftKey()
  if (!key) return
  const raw = localStorage.getItem(key)
  if (!raw) return
  try {
    const d = JSON.parse(raw) as Record<string, unknown>
    if (typeof d.Title === 'string') form.Title = d.Title
    if (typeof d.Description === 'string') form.Description = d.Description
    if (typeof d.DueDate === 'string') form.DueDate = d.DueDate
    if (typeof d.IsCompleted === 'boolean') form.IsCompleted = d.IsCompleted
  } catch {
    return
  }
}

function clearDraft() {
  if (!import.meta.client) {
    return
  }
  const key = draftKey()
  if (key) {
    localStorage.removeItem(key)
  }
}

function openCreate() {
  editingId.value = null
  form.Title = ''
  form.Description = ''
  form.DueDate = new Date().toISOString().slice(0, 10)
  form.IsCompleted = false
  formError.value = ''
  applyDraft()
  modalOpen.value = true
}

function openEdit(t: Task) {
  editingId.value = t.Id
  form.Title = t.Title
  form.Description = t.Description
  form.DueDate = t.DueDate.slice(0, 10)
  form.IsCompleted = t.IsCompleted
  formError.value = ''
  applyDraft()
  modalOpen.value = true
}

function closeModal() {
  modalOpen.value = false
}

async function saveTask() {
  formError.value = ''
  if (!form.Title.trim()) {
    formError.value = 'Укажите название'
    return
  }
  if (!form.DueDate) {
    formError.value = 'Укажите дедлайн'
    return
  }
  saving.value = true
  try {
    const payload = {
      Title: form.Title.trim(),
      Description: form.Description,
      DueDate: form.DueDate,
      IsCompleted: form.IsCompleted,
    }
    if (editingId.value) {
      await $api.put(`/tasks/${editingId.value}`, payload)
    } else {
      await $api.post('/tasks', payload)
    }
    clearDraft()
    modalOpen.value = false
    await fetchTasks()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string }; status?: number } }
    if (err.response?.status === 403) {
      formError.value = 'Недостаточно прав'
    } else {
      formError.value = err.response?.data?.message || 'Ошибка сохранения'
    }
  } finally {
    saving.value = false
  }
}

async function confirmDelete(t: Task) {
  if (!canModify(t)) return
  if (!import.meta.client || !window.confirm(`Удалить «${t.Title}»?`)) return
  try {
    await $api.delete(`/tasks/${t.Id}`)
    await fetchTasks()
  } catch (e: unknown) {
    const err = e as { response?: { status?: number } }
    if (err.response?.status === 403) {
      error.value = 'Нет прав на удаление'
    } else {
      error.value = 'Не удалось удалить'
    }
  }
}

onMounted(() => {
  loadUser()
  fetchTasks()
})
</script>
