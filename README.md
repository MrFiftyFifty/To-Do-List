# To-Do List (Nuxt 3 + Axios + TypeScript)

Fullstack мини-приложение «Список задач» с авторизацией, CRUD, фильтрами, поиском с debounce, пагинацией и ролями (admin / user). REST API реализован как **Nuxt Server API** (серверные маршруты в `server/api/`) с JWT-авторизацией и хранением данных в **SQLite**.

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

При первом запуске автоматически создаётся файл `data.db` (SQLite) с таблицами `users` и `tasks`. Тестовые пользователи добавляются при пустой таблице `users`.

Сборка production:

```bash
npm run build
node .output/server/index.mjs
```

### Переменные окружения (опционально)

| Переменная   | По умолчанию                        | Описание                  |
|-------------|--------------------------------------|---------------------------|
| `JWT_SECRET` | `dev-secret-change-in-production`   | Секрет для подписи JWT    |

## Стек

| Компонент   | Версия / пакет                       |
|------------|---------------------------------------|
| Nuxt       | 3.x                                  |
| Vue        | 3                                     |
| TypeScript | да                                    |
| HTTP       | Axios (`$api`)                       |
| Стили      | Tailwind CSS                          |
| Server API | Nuxt Server Routes (`server/api/`)   |
| БД         | SQLite (`better-sqlite3`)            |
| JWT        | HMAC-SHA256 (Node.js `crypto`)       |

## Структура

```
server/
  api/
    auth/login.post.ts        ← POST /api/auth/login
    tasks/index.get.ts         ← GET  /api/tasks
    tasks/index.post.ts        ← POST /api/tasks
    tasks/[id].put.ts          ← PUT  /api/tasks/:id
    tasks/[id].delete.ts       ← DELETE /api/tasks/:id
  utils/db.ts                  ← инициализация SQLite, миграция, seed
  utils/jwt.ts                 ← JWT sign / verify (HMAC-SHA256)
  utils/auth.ts                ← извлечение пользователя из токена
src/
  app.vue
  assets/css/main.css
  layouts/default.vue
  middleware/auth.global.ts
  pages/index.vue
  pages/login.vue
  plugins/axios.ts
  types/task.ts
```

## База данных

SQLite-файл `data.db` создаётся автоматически в корне проекта. Схема:

```sql
CREATE TABLE users (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  email    TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role     TEXT NOT NULL DEFAULT 'user'
);

CREATE TABLE tasks (
  Id          INTEGER PRIMARY KEY AUTOINCREMENT,
  Title       TEXT    NOT NULL,
  Description TEXT    NOT NULL DEFAULT '',
  DueDate     TEXT    NOT NULL,
  IsCompleted INTEGER NOT NULL DEFAULT 0,
  CreatedBy   INTEGER NOT NULL REFERENCES users(id),
  CreatedAt   TEXT    NOT NULL
);
```

Данные сохраняются между перезапусками сервера. Для сброса — удалить `data.db`.

## Тестовые пользователи

| Email          | Пароль | Роль  |
|----------------|--------|-------|
| admin@test.com | 123456 | admin |
| user@test.com  | 123456 | user  |

Seed-пользователи создаются автоматически при первом запуске (пустая таблица `users`).

Токен — настоящий JWT (HMAC-SHA256), содержит `{ id, email, role, iat, exp }`. Хранится в `localStorage` под ключом `token` и в cookie `token` (для согласованного редиректа при SSR); объект пользователя — `user` (JSON).

## API (Nuxt Server Routes, префикс `/api`)

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

Правила: редактирование и удаление — только автор задачи или роль `admin` (сервер возвращает `403` при нарушении).

## Скриншоты

Файлы в [`docs/`](docs/): `screenshot-login.png`, `screenshot-tasks.png` (сняты при запущенном `npm run dev`).

## Зависимости

Актуальный lock-файл: [`package-lock.json`](package-lock.json).
