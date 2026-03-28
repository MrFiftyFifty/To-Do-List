# To-Do List (Nuxt 3 + Axios + MSW + TypeScript)

Мини-приложение «Список задач» с авторизацией, CRUD, фильтрами, поиском с debounce, пагинацией и ролями (admin / user). В режиме разработки REST API эмулируется через **MSW (Mock Service Worker)**.

## Требования

- **Node.js** `>=22.12` (в репозитории есть [`.nvmrc`](.nvmrc): `nvm use`)
- npm 10+

Переменные окружения для локального запуска не обязательны: `runtimeConfig.public.apiBase` по умолчанию `/api`.

## Установка и запуск

```bash
nvm use
npm install
npm run dev
```

Приложение: `http://localhost:3000` (порт подставит Nuxt при занятости).

Сборка production:

```bash
npm run build
node .output/server/index.mjs
```

MSW подключается **только в dev** (`import.meta.env.PROD` — worker не стартует). В production ожидается реальный бэкенд с тем же контрактом API.

## Стек

| Компонент   | Версия / пакет        |
|------------|------------------------|
| Nuxt       | 3.x                    |
| Vue        | 3                      |
| TypeScript | да                     |
| HTTP       | Axios (`$api`)        |
| Стили      | Tailwind CSS           |
| Моки API   | MSW 2.x, worker в `src/public/` |

## Структура

```
src/
  app.vue
  assets/css/main.css
  layouts/default.vue
  middleware/auth.global.ts
  pages/index.vue
  pages/login.vue
  plugins/01.msw.client.ts
  plugins/02.axios.ts
  mocks/
    browser.ts
    handlers/auth.handlers.ts
    handlers/tasks.handlers.ts
    data/*.ts
    utils/auth.ts
  types/task.ts
  public/mockServiceWorker.js
```

Порядок плагинов: сначала MSW, затем Axios.

## Тестовые пользователи

| Email          | Пароль | Роль  |
|----------------|--------|-------|
| admin@test.com | 123456 | admin |
| user@test.com  | 123456 | user  |

Токен (fake JWT): строка `String(user.id)` в `localStorage` под ключом `token` и в cookie `token` (для согласованного редиректа при SSR); объект пользователя — `user` (JSON).

## API (моки MSW, префикс `/api`)

Все защищённые маршруты: заголовок `Authorization: Bearer <token>`.

### POST /api/auth/login

Тело: `{ "email": string, "password": string }`

Успех: `{ "token": string, "user": { "id", "email", "role" } }`

Ошибки: `400` (пустые поля / невалидный JSON), `401` (неверные учётные данные).

### GET /api/tasks

Ответ: `{ "data": Task[], "meta": { "total", "page", "pageSize" } }`

Query-параметры (опционально):

| Параметр      | Описание |
|---------------|----------|
| page          | Номер страницы (с 1) |
| pageSize      | Размер страницы (1–100) |
| q             | Поиск по подстроке в Title и Description |
| sortBy        | `createdAt` \| `dueDate` \| `status` \| `title` |
| sortOrder     | `asc` \| `desc` |
| quick         | `active` \| `completed` \| `overdue` |
| authorId      | Фильтр по `CreatedBy` |
| createdFrom   | ISO: задачи с `CreatedAt` не раньше |
| createdTo     | ISO: задачи с `CreatedAt` не позже |

Ошибки: `401` без токена.

### POST /api/tasks

Тело (PascalCase как в ТЗ):

```json
{
  "Title": "Название",
  "Description": "Опционально",
  "DueDate": "2026-02-20",
  "IsCompleted": false
}
```

Успех: `201` и объект задачи. Ошибки: `400`, `401`.

### PUT /api/tasks/:id

Тело как у POST. Успех: `200`. Ошибки: `400`, `401`, `403` (не владелец и не admin), `404`.

### DELETE /api/tasks/:id

Успех: `204` без тела. Ошибки: `400`, `401`, `403`, `404`.

### Диагностика (только мок)

`GET /api/_msw/test-500` — всегда ответ `500` (проверка обработки ошибки на клиенте при необходимости).

## Модель задачи

| Поле         | Тип     |
|-------------|---------|
| Id          | number  |
| Title       | string  |
| Description | string  |
| DueDate     | string (дата) |
| IsCompleted | boolean |
| CreatedBy   | number (id пользователя) |
| CreatedAt   | string (ISO) |

Правила: редактирование и удаление — только автор задачи или роль `admin` (на моках возвращается `403` при нарушении).

## Скриншоты

Файлы в [`docs/`](docs/): `screenshot-login.png`, `screenshot-tasks.png` (сняты при запущенном `npm run dev`).

## Зависимости

Актуальный lock-файл: [`package-lock.json`](package-lock.json).
