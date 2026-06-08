import { useState } from 'react'
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

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('timer')
  // 初始化主题（在最顶层，确保 class 尽早设置）
  useTheme()

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
