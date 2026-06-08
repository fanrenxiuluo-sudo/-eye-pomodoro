import { useEffect, useState, useCallback, useRef } from 'react'
import type { Settings } from '../../../shared/types'
import { DEFAULT_SETTINGS } from '../../../shared/types'
import { useTheme, type Theme } from '../hooks/useTheme'

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({ ...DEFAULT_SETTINGS })
  const [loaded, setLoaded] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [theme, setTheme] = useTheme()

  useEffect(() => {
    window.api.settingsGet().then((data) => {
      setSettings(data as Settings)
      setLoaded(true)
    })
  }, [])

  const saveSettings = useCallback((newSettings: Settings) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      window.api.settingsSave(newSettings as unknown as Record<string, unknown>)
    }, 500)
  }, [])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  const handleChange = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value }
        if (loaded) saveSettings(next)
        return next
      })
    },
    [loaded, saveSettings]
  )

  const handleNumberChange = useCallback(
    (key: keyof Settings, value: string, min: number, max: number) => {
      const num = parseInt(value, 10)
      if (!isNaN(num) && num >= min && num <= max) {
        handleChange(key, num)
      }
    },
    [handleChange]
  )

  const handleThemeChange = useCallback(
    (value: string) => {
      setTheme(value as Theme)
    },
    [setTheme]
  )

  return (
    <div className="page settings-page">
      <h2>设置</h2>

      {/* ── 外观 ── */}
      <div className="settings-section">
        <h3>外观</h3>
        <div className="setting-item">
          <label>主题</label>
          <select value={theme} onChange={(e) => handleThemeChange(e.target.value)}>
            <option value="system">跟随系统</option>
            <option value="dark">深色</option>
            <option value="light">浅色</option>
          </select>
        </div>
      </div>

      {/* ── 时间设置 ── */}
      <div className="settings-section">
        <h3>时间设置</h3>
        <div className="setting-item">
          <label>专注时长（分钟）</label>
          <input
            type="number"
            value={settings.workDuration}
            min={1}
            max={120}
            onChange={(e) => handleNumberChange('workDuration', e.target.value, 1, 120)}
          />
        </div>
        <div className="setting-item">
          <label>短休息时长（分钟）</label>
          <input
            type="number"
            value={settings.shortBreakDuration}
            min={1}
            max={30}
            onChange={(e) => handleNumberChange('shortBreakDuration', e.target.value, 1, 30)}
          />
        </div>
        <div className="setting-item">
          <label>长休息时长（分钟）</label>
          <input
            type="number"
            value={settings.longBreakDuration}
            min={1}
            max={60}
            onChange={(e) => handleNumberChange('longBreakDuration', e.target.value, 1, 60)}
          />
        </div>
        <div className="setting-item">
          <label>几个番茄后长休息</label>
          <input
            type="number"
            value={settings.pomodorosBeforeLongBreak}
            min={2}
            max={10}
            onChange={(e) =>
              handleNumberChange('pomodorosBeforeLongBreak', e.target.value, 2, 10)
            }
          />
        </div>
      </div>

      {/* ── 行为设置 ── */}
      <div className="settings-section">
        <h3>行为设置</h3>
        <div className="setting-item">
          <label>强制休息（不可跳过）</label>
          <input
            type="checkbox"
            checked={settings.forcedBreak}
            onChange={(e) => handleChange('forcedBreak', e.target.checked)}
          />
        </div>
        <div className="setting-item">
          <label>休息时显示全屏遮罩</label>
          <input
            type="checkbox"
            checked={settings.showOverlay}
            onChange={(e) => handleChange('showOverlay', e.target.checked)}
          />
        </div>
        <div className="setting-item">
          <label>自动开始休息</label>
          <input
            type="checkbox"
            checked={settings.autoStartBreak}
            onChange={(e) => handleChange('autoStartBreak', e.target.checked)}
          />
        </div>
        <div className="setting-item">
          <label>自动开始专注</label>
          <input
            type="checkbox"
            checked={settings.autoStartWork}
            onChange={(e) => handleChange('autoStartWork', e.target.checked)}
          />
        </div>
      </div>

      {/* ── 提醒设置 ── */}
      <div className="settings-section">
        <h3>提醒设置</h3>
        <div className="setting-item">
          <label>声音提醒</label>
          <input
            type="checkbox"
            checked={settings.soundEnabled}
            onChange={(e) => handleChange('soundEnabled', e.target.checked)}
          />
        </div>
        <div className="setting-item">
          <label>系统通知</label>
          <input
            type="checkbox"
            checked={settings.notificationEnabled}
            onChange={(e) => handleChange('notificationEnabled', e.target.checked)}
          />
        </div>
      </div>

      {/* ── 系统设置 ── */}
      <div className="settings-section">
        <h3>系统设置</h3>
        <div className="setting-item">
          <label>开机自启动</label>
          <input
            type="checkbox"
            checked={settings.autoStartOnBoot}
            onChange={(e) => handleChange('autoStartOnBoot', e.target.checked)}
          />
        </div>
      </div>
    </div>
  )
}
