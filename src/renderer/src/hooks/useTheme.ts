import { useState, useEffect, useCallback } from 'react'

export type Theme = 'dark' | 'light' | 'system'

const STORAGE_KEY = 'eyetimer-theme'

/**
 * 主题管理 Hook
 *
 * 管理 dark / light / system 三种主题模式。
 * 通过在 <html> 元素上设置 class 控制 CSS 变量切换。
 * - .theme-dark  → 使用 :root 默认变量（深色）
 * - .theme-light → 使用 .theme-light 覆盖变量（浅色）
 * - .theme-system → 使用 @media (prefers-color-scheme) 自动切换
 */
export function useTheme(): [Theme, (theme: Theme) => void] {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      return (localStorage.getItem(STORAGE_KEY) as Theme) || 'system'
    } catch {
      return 'system'
    }
  })

  const applyTheme = useCallback((t: Theme) => {
    const root = document.documentElement
    root.classList.remove('theme-dark', 'theme-light', 'theme-system')
    root.classList.add(`theme-${t}`)
  }, [])

  const setTheme = useCallback(
    (t: Theme) => {
      setThemeState(t)
      try {
        localStorage.setItem(STORAGE_KEY, t)
      } catch {
        // ignore
      }
      applyTheme(t)
    },
    [applyTheme]
  )

  // 初始化 + 监听系统主题变化
  useEffect(() => {
    applyTheme(theme)

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => {
        // system 模式下，class 已经是 theme-system，CSS media query 自动处理
        // 这里只是触发 re-render（如果需要）
      }
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [theme, applyTheme])

  return [theme, setTheme]
}
