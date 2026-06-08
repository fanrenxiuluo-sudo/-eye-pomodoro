import { useEffect, useState, useCallback, useRef } from 'react'
import type { Settings } from '../../../shared/types'
import { DEFAULT_SETTINGS } from '../../../shared/types'
import { useTheme, type Theme } from '../hooks/useTheme'

interface UpdateStatus {
  checking: boolean
  available: boolean
  currentVersion: string
  latestVersion: string | null
  downloadProgress: number
  error: string | null
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({ ...DEFAULT_SETTINGS })
  const [loaded, setLoaded] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [theme, setTheme] = useTheme()
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({
    checking: false,
    available: false,
    currentVersion: '',
    latestVersion: null,
    downloadProgress: 0,
    error: null
  })

  useEffect(() => {
    window.api.settingsGet().then((data) => {
      setSettings(data as Settings)
      setLoaded(true)
    })

    // 获取当前版本
    window.api.getVersion().then((v) => {
      setUpdateStatus((prev) => ({ ...prev, currentVersion: v }))
    })

    // 监听更新状态推送
    const unsub = window.api.onUpdateStatus((status) => {
      setUpdateStatus((prev) => ({ ...prev, ...status }))
    })

    return () => unsub()
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

      {/* ── 关于 / 检查更新 ── */}
      <div className="settings-section">
        <h3>关于</h3>
        <div className="setting-item">
          <label>当前版本</label>
          <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            v{updateStatus.currentVersion || '...'}
          </span>
        </div>

        {updateStatus.available && updateStatus.latestVersion && (
          <div className="setting-item">
            <label>最新版本</label>
            <span style={{ color: '#52c41a', fontSize: '14px', fontWeight: 600 }}>
              v{updateStatus.latestVersion} ✨
            </span>
          </div>
        )}

        {updateStatus.downloadProgress > 0 && updateStatus.downloadProgress < 100 && (
          <div className="setting-item">
            <label>下载进度</label>
            <div style={{ flex: 1, maxWidth: 200 }}>
              <div
                style={{
                  height: 6,
                  borderRadius: 3,
                  background: 'var(--border-color)',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${updateStatus.downloadProgress}%`,
                    background: '#1677ff',
                    borderRadius: 3,
                    transition: 'width 0.3s'
                  }}
                />
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {updateStatus.downloadProgress}%
              </span>
            </div>
          </div>
        )}

        {updateStatus.error && (
          <div className="setting-item">
            <label>错误</label>
            <span style={{ color: '#ff4d4f', fontSize: '13px' }}>{updateStatus.error}</span>
          </div>
        )}

        <div className="setting-item" style={{ gap: '8px' }}>
          <button
            className="update-btn"
            onClick={() => window.api.updateCheck()}
            disabled={updateStatus.checking}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-color)',
              color: 'var(--text-color)',
              cursor: updateStatus.checking ? 'not-allowed' : 'pointer',
              fontSize: '13px'
            }}
          >
            {updateStatus.checking ? '检查中...' : '检查更新'}
          </button>

          <button
            className="update-btn"
            onClick={() => window.api.updateOpenReleases()}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              border: '1px solid var(--border-color)',
              background: 'var(--bg-color)',
              color: 'var(--text-color)',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            在浏览器中查看
          </button>
        </div>
      </div>
    </div>
  )
}
