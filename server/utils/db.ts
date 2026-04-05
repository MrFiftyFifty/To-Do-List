import Database from 'better-sqlite3'
import { resolve } from 'node:path'

let _db: Database.Database | null = null

export function useDb(): Database.Database {
  if (_db) return _db

  const dbPath = resolve(process.cwd(), 'data.db')
  _db = new Database(dbPath)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')

  _db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      email    TEXT    NOT NULL UNIQUE,
      password TEXT    NOT NULL,
      role     TEXT    NOT NULL DEFAULT 'user'
    );

    CREATE TABLE IF NOT EXISTS tasks (
      Id          INTEGER PRIMARY KEY AUTOINCREMENT,
      Title       TEXT    NOT NULL,
      Description TEXT    NOT NULL DEFAULT '',
      DueDate     TEXT    NOT NULL,
      IsCompleted INTEGER NOT NULL DEFAULT 0,
      CreatedBy   INTEGER NOT NULL REFERENCES users(id),
      CreatedAt   TEXT    NOT NULL
    );
  `)

  const count = _db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }
  if (count.c === 0) {
    const insertUser = _db.prepare('INSERT INTO users (email, password, role) VALUES (?, ?, ?)')
    insertUser.run('admin@test.com', '123456', 'admin')
    insertUser.run('user@test.com', '123456', 'user')
  }

  return _db
}
