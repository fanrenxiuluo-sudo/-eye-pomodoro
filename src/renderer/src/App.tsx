import { useState, useEffect, useCallback } from 'react'
import { Timer, BarChart3, Settings } from 'lucide-react'
import TimerPage from './pages/TimerPage'
import StatsPage from './pages/StatsPage'
import SettingsPage from './pages/SettingsPage'
import { useTheme } from './hooks/useTheme'

type Tab = 'timer' | 'stats' | 'settings'

const tabs: { key: Tab; label: string; icon: typeof Timer }[] = [
  { key: 'timer', label: '专注', icon: Timer },
  { key: 'stats', label: '统计', icon: BarChart3 },
  { key: 'settings', label: '设置', icon: Settings }
]

export function applyWarmFilter(enabled: boolean, intensity: number): void {
  const root = document.documentElement
  if (enabled) {
    const sepia = intensity * 0.004
    const saturate = 1 + intensity * 0.003
    const hueRotate = intensity * -0.15
    root.style.filter = `sepia(${sepia}) saturate(${saturate}) hue-rotate(${hueRotate}deg)`
  } else {
    root.style.filter = ''
  }
}

function useWarmFilter() {
  useEffect(() => {
    window.api.settingsGet().then((s) => {
      applyWarmFilter(!!s.warmFilter, (s.warmFilterIntensity as number) ?? 40)
    })
  }, [])
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('timer')
  useTheme()
  useWarmFilter()

  return (
    <div className="app">
      <main className="app-content">
        {activeTab === 'timer' && <TimerPage />}
        {activeTab === 'stats' && <StatsPage />}
        {activeTab === 'settings' && <SettingsPage />}
      </main>
      <nav className="tab-bar">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              className={`tab-item ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <Icon size={20} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
