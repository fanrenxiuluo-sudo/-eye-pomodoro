import { DEFAULT_SETTINGS } from '../../shared/types'
import type { Settings } from '../../shared/types'

/**
 * 设置持久化模块
 *
 * 使用 electron-store 在 userData 目录下保存用户设置。
 * electron-store 在 app ready 后自动创建配置文件。
 */
let store: { get: (key: string) => unknown; set: (key: string, value: unknown) => void; has: (key: string) => boolean } | null = null
let currentSettings: Settings = { ...DEFAULT_SETTINGS }

/**
 * 初始化设置存储（必须在 app.whenReady() 之后调用）
 */
export async function initSettings(): Promise<void> {
  const ElectronStore = (await import('electron-store')).default

  const schema = {
    workDuration: { type: 'number', default: DEFAULT_SETTINGS.workDuration },
    shortBreakDuration: { type: 'number', default: DEFAULT_SETTINGS.shortBreakDuration },
    longBreakDuration: { type: 'number', default: DEFAULT_SETTINGS.longBreakDuration },
    pomodorosBeforeLongBreak: {
      type: 'number',
      default: DEFAULT_SETTINGS.pomodorosBeforeLongBreak
    },
    forcedBreak: { type: 'boolean', default: DEFAULT_SETTINGS.forcedBreak },
    showOverlay: { type: 'boolean', default: DEFAULT_SETTINGS.showOverlay },
    autoStartBreak: { type: 'boolean', default: DEFAULT_SETTINGS.autoStartBreak },
    autoStartWork: { type: 'boolean', default: DEFAULT_SETTINGS.autoStartWork },
    soundEnabled: { type: 'boolean', default: DEFAULT_SETTINGS.soundEnabled },
    soundVolume: { type: 'number', default: DEFAULT_SETTINGS.soundVolume },
    notificationEnabled: { type: 'boolean', default: DEFAULT_SETTINGS.notificationEnabled },
    theme: { type: 'string', default: DEFAULT_SETTINGS.theme },
    autoStartOnBoot: { type: 'boolean', default: DEFAULT_SETTINGS.autoStartOnBoot },
    warmFilter: { type: 'boolean', default: DEFAULT_SETTINGS.warmFilter },
    warmFilterIntensity: { type: 'number', default: DEFAULT_SETTINGS.warmFilterIntensity }
  }

  store = new ElectronStore({ schema })

  // 从 electron-store 加载所有设置
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    if (store.has(key)) {
      ;(currentSettings as Record<string, unknown>)[key] = store.get(key)
    }
  }
}

/** 获取当前设置（深拷贝） */
export function getSettings(): Settings {
  return { ...currentSettings }
}

/** 保存完整设置 */
export function saveSettings(settings: Settings): void {
  currentSettings = { ...settings }

  // 同步写入 electron-store
  if (store) {
    for (const [key, value] of Object.entries(settings)) {
      store.set(key, value)
    }
  }
}

/** 部分更新设置 */
export function updateSettings(partial: Partial<Settings>): void {
  currentSettings = { ...currentSettings, ...partial }

  if (store) {
    for (const [key, value] of Object.entries(partial)) {
      if (key === 'key') continue
      store.set(key, value)
    }
  }
}
