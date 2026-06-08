import { app } from 'electron'
import initSqlJs, { type Database } from 'sql.js'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import log from 'electron-log'

let db: Database | null = null
let dbPath: string

/**
 * 初始化 SQLite 数据库（sql.js WASM）
 *
 * 使用 PRAGMA user_version 管理 schema 版本。
 * 每次写操作后防抖 1 秒自动保存到磁盘。
 */
export async function initDatabase(): Promise<void> {
  const dir = app.getPath('userData')
  dbPath = join(dir, 'eyecare-pomodoro.db')

  // 确保目录存在
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  const SQL = await initSqlJs({
    locateFile: (file) => join(__dirname, '../../node_modules/sql.js/dist', file)
  })

  // 加载已有数据库或创建新数据库
  if (existsSync(dbPath)) {
    const buffer = readFileSync(dbPath)
    db = new SQL.Database(buffer)
    log.info('Database loaded from disk')
  } else {
    db = new SQL.Database()
    log.info('New database created')
  }

  // 运行迁移
  migrate(db)

  // 初始保存
  saveDb()
  log.info('Database initialized')
}

/**
 * 获取数据库实例
 */
export function getDb(): Database {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.')
  return db
}

/**
 * 保存数据库到磁盘
 */
export function saveDb(): void {
  if (!db || !dbPath) return
  try {
    const data = db.export()
    writeFileSync(dbPath, Buffer.from(data))
  } catch (e) {
    log.error('Failed to save database:', e)
  }
}

// ─── 防抖保存 ─────────────────────────────────

let saveTimer: ReturnType<typeof setTimeout> | null = null

/**
 * 防抖保存——频繁写操作后只在最后一次写入后 1 秒执行磁盘保存
 */
export function debouncedSave(): void {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveDb()
    saveTimer = null
  }, 1000)
}

// ─── Schema 迁移 ──────────────────────────────

const CURRENT_VERSION = 1

function migrate(database: Database): void {
  const result = database.exec('PRAGMA user_version')
  const version = result[0]?.values[0]?.[0] as number ?? 0

  if (version >= CURRENT_VERSION) return

  log.info(`Migrating database from v${version} to v${CURRENT_VERSION}`)

  if (version < 1) {
    migrateV1(database)
  }

  // 新版本迁移在此追加...

  database.exec(`PRAGMA user_version = ${CURRENT_VERSION}`)
}

function migrateV1(database: Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS pomodoro_records (
      id TEXT PRIMARY KEY,
      startTime TEXT NOT NULL,
      endTime TEXT NOT NULL,
      duration INTEGER NOT NULL,
      actualDuration INTEGER NOT NULL,
      completed INTEGER NOT NULL DEFAULT 1,
      type TEXT NOT NULL DEFAULT 'work'
    );

    CREATE TABLE IF NOT EXISTS break_records (
      id TEXT PRIMARY KEY,
      startTime TEXT NOT NULL,
      endTime TEXT NOT NULL,
      duration INTEGER NOT NULL,
      actualDuration INTEGER NOT NULL,
      completed INTEGER NOT NULL DEFAULT 1,
      type TEXT NOT NULL DEFAULT 'short-break'
    );

    CREATE TABLE IF NOT EXISTS metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)

  log.info('Schema v1 created')
}
