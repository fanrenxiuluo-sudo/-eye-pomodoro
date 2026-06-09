import { BrowserWindow, screen, app } from 'electron'
import log from 'electron-log'
import { timerService } from '../timer/timerService'
import { PhaseState } from '../timer/timerState'
import { getSettings } from '../storage/settingsStore'
import type { TimerStateData } from '../timer/timerTypes'
import {
  getRandomTip,
  formatTipForOverlay,
  getBreakType,
  type EyeTip
} from '../eyecare/tipData'

let overlayWindows: BrowserWindow[] = []
let tickInterval: ReturnType<typeof setInterval> | null = null
let isShowing = false
let currentRemaining = 0
let currentTotal = 0
let currentPhase = ''
let currentTip: EyeTip | null = null // 当前显示的护眼提示

/**
 * 判断当前是否为长休息阶段
 */
function isLongBreakPhase(phase: string): boolean {
  return phase === PhaseState.LONG_BREAK || phase === PhaseState.PAUSED_LONG_BREAK
}

/**
 * 生成遮罩窗口 HTML（含 3 秒 Esc 紧急退出检测 + 护眼提示卡片）
 */
function getOverlayHtml(tip: EyeTip | null, showSkip: boolean, forcedBreak: boolean): string {
  const skipBtn = showSkip
    ? `<button id="skip" onclick="require('electron').ipcRenderer.invoke('overlay:skip')">
         ⏭ 跳过休息
       </button>`
    : ''

  // 护眼提示卡片内容
  const tipHtml = tip
    ? `<div class="tip-card">
         <div class="tip-badge">${tip.category === 'exercise' ? '🏋️ 运动' : tip.category === 'quick' ? '⚡ 快速' : tip.category === 'environment' ? '💡 环境' : '🌱 生活'}</div>
         <div class="tip-title">${tip.title}</div>
         <div class="tip-content">${tip.content}</div>
         <div class="tip-meta">
           <span class="tip-duration">⏱ ${tip.duration}</span>
           <span class="tip-source">📎 ${tip.source}</span>
         </div>
       </div>`
    : `<div id="tip">休息一下，让眼睛放松</div>`

  // 强制休息时：3 秒长按 Esc 紧急退出
  const escapeScript = forcedBreak
    ? `
<script>
const { ipcRenderer } = require('electron');
let escTimer = null;
let escStart = 0;
const ESC_HOLD_MS = 3000;

const ring = document.getElementById('esc-ring');
const ringCircle = document.getElementById('esc-ring-circle');
const circumference = 2 * Math.PI * 38;

if (ringCircle) {
  ringCircle.style.strokeDasharray = circumference;
  ringCircle.style.strokeDashoffset = circumference;
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !escTimer) {
    escStart = Date.now();
    escTimer = setInterval(() => {
      const elapsed = Date.now() - escStart;
      const progress = Math.min(elapsed / ESC_HOLD_MS, 1);
      if (ringCircle) ringCircle.style.strokeDashoffset = circumference * (1 - progress);
      if (progress >= 1) {
        clearInterval(escTimer); escTimer = null;
        ipcRenderer.invoke('overlay:emergency-exit');
      }
    }, 30);
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'Escape' && escTimer) {
    clearInterval(escTimer); escTimer = null; escStart = 0;
    if (ringCircle) ringCircle.style.strokeDashoffset = circumference;
  }
});
</script>`
    : `
<script>
const { ipcRenderer } = require('electron');
ipcRenderer.on('overlay:update', (_e, data) => {
  document.getElementById('timer').textContent = data.timeStr;
});
</script>`

  // Esc 按住提示 + 圆环进度（仅强制模式）
  const escHint = forcedBreak
    ? `<div id="esc-hint">
         <svg width="88" height="88" viewBox="0 0 88 88">
           <circle id="esc-ring" cx="44" cy="44" r="38" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="3"/>
           <circle id="esc-ring-circle" cx="44" cy="44" r="38" fill="none" stroke="rgba(255,108,126,0.6)" stroke-width="3"
             stroke-linecap="round" transform="rotate(-90 44 44)"
             style="stroke-dasharray:${2 * Math.PI * 38};stroke-dashoffset:${2 * Math.PI * 38};transition:stroke-dashoffset 0.03s linear"/>
         </svg>
         <span>按住 Esc 3 秒可紧急退出</span>
       </div>`
    : ''

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
html, body {
  width:100vw; height:100vh; overflow:hidden;
  background:rgba(15,12,8,0.92);
  display:flex; flex-direction:column;
  align-items:center; justify-content:center;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Microsoft YaHei',sans-serif;
  color:#f0e6d8; user-select:none; -webkit-app-region:no-drag;
}
#timer { font-size:100px; font-weight:200; letter-spacing:4px;
  font-variant-numeric:tabular-nums; margin:20px 0; }
#label { font-size:18px; color:#c8b89a; margin-bottom:16px; }
#tip { font-size:16px; color:#a09080; margin-top:12px; }
#skip {
  margin-top:40px; padding:10px 28px;
  background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15);
  border-radius:24px; color:#a09080; font-size:14px;
  cursor:pointer; transition:all .2s;
}
#skip:hover { background:rgba(255,255,255,0.15); color:#f0e6d8; }
.eye-icon { opacity:0.12; }

/* 护眼提示卡片 */
.tip-card {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  padding: 20px 28px;
  max-width: 480px;
  text-align: left;
  animation: tipFadeIn 0.8s ease;
}
.tip-badge {
  display: inline-block;
  background: rgba(108,204,255,0.15);
  color: #6cccff;
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 12px;
  margin-bottom: 10px;
}
.tip-title {
  font-size: 20px;
  font-weight: 600;
  color: #f0e6d8;
  margin-bottom: 10px;
}
.tip-content {
  font-size: 14px;
  color: #b8a898;
  line-height: 1.7;
  white-space: pre-line;
}
.tip-meta {
  display: flex;
  gap: 16px;
  margin-top: 12px;
  font-size: 12px;
  color: #807060;
}
.tip-duration { color: #6cccff; }
.tip-source { color: #a09080; }

@keyframes tipFadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

#esc-hint {
  position:fixed; bottom:32px; right:32px;
  display:flex; align-items:center; gap:10px;
  color:rgba(255,255,255,0.25); font-size:12px;
}
#esc-hint svg { opacity:0.5; }
</style></head><body>
<svg class="eye-icon" width="180" height="120" viewBox="0 0 24 24" fill="none"
  stroke="#f0e6d8" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
  <circle cx="12" cy="12" r="3"/>
</svg>
<div id="label">休息一下，让眼睛放松</div>
<div id="timer">00:00</div>
${tipHtml}
${skipBtn}
${escHint}
${escapeScript}
</body></html>`
}

/**
 * 创建所有显示器上的遮罩窗口
 */
function createOverlays(): void {
  if (isShowing) return

  const displays = screen.getAllDisplays()
  const settings = getSettings()
  const showSkip = !settings.forcedBreak
  const breakType = getBreakType(
    timerService.getState().pomodorosCompleted,
    settings.pomodorosBeforeLongBreak
  )
  currentTip = getRandomTip(breakType)

  log.info(`Overlay tip: [${breakType}] ${currentTip.title} (${currentTip.source})`)

  for (const display of displays) {
    const { x, y, width, height } = display.bounds

    const overlay = new BrowserWindow({
      x,
      y,
      width,
      height,
      fullscreen: true,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      movable: false,
      // 强制休息时 focusable: true 以接收 Esc 键盘事件
      focusable: settings.forcedBreak,
      hasShadow: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        sandbox: false
      }
    })

    overlay.setAlwaysOnTop(true, 'screen-saver')
    overlay.setIgnoreMouseEvents(false) // 拦截鼠标

    // 拦截可能导致关闭的输入
    overlay.webContents.on('before-input-event', (event, input) => {
      // 阻止鼠标点击穿透
      if (input.type === 'mouseDown') {
        event.preventDefault()
      }
      // 非强制模式下阻止 Esc（强制模式由 overlay JS 处理 3 秒长按）
      if (!settings.forcedBreak && input.key === 'Escape') {
        event.preventDefault()
      }
    })

    overlay.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(getOverlayHtml(currentTip, showSkip, settings.forcedBreak))}`)
    overlayWindows.push(overlay)
  }

  // 强制休息模式 → 聚焦第一个遮罩窗口以接收键盘事件
  if (settings.forcedBreak && overlayWindows.length > 0) {
    overlayWindows[0].focus()
  }

  isShowing = true
  log.info(`Overlay created on ${displays.length} display(s) [forced=${settings.forcedBreak}]`)
}

/**
 * 销毁所有遮罩窗口
 */
function destroyOverlays(): void {
  for (const overlay of overlayWindows) {
    if (!overlay.isDestroyed()) {
      overlay.destroy()
    }
  }
  overlayWindows = []
  isShowing = false
  currentTip = null
  log.info('All overlays destroyed')
}

/**
 * 向所有遮罩窗口广播更新数据
 */
function broadcastToOverlays(timeStr: string): void {
  for (const overlay of overlayWindows) {
    if (!overlay.isDestroyed()) {
      overlay.webContents.send('overlay:update', { timeStr })
    }
  }
}

/**
 * 初始化遮罩管理器
 */
export function initOverlayManager(): void {
  // ─── 状态变更 → 显示/隐藏遮罩 ───
  timerService.onStateChange((state: TimerStateData) => {
    const phase = state.phase as PhaseState
    const settings = getSettings()

    if (!settings.showOverlay) {
      if (isShowing) destroyOverlays()
      return
    }

    const isBreak =
      phase === PhaseState.SHORT_BREAK || phase === PhaseState.LONG_BREAK

    if (isBreak && !isShowing) {
      currentRemaining = state.remaining
      currentTotal = state.total
      currentPhase = state.phase
      createOverlays()
      startOverlayTick()
    } else if (!isBreak && isShowing) {
      stopOverlayTick()
      destroyOverlays()
    } else if (isShowing) {
      currentRemaining = state.remaining
      currentTotal = state.total
      currentPhase = state.phase
    }
  })

  // ─── 显示器热插拔 ───
  screen.on('display-added', () => {
    if (isShowing) {
      destroyOverlays()
      createOverlays()
      updateOverlayContent()
    }
  })

  screen.on('display-removed', () => {
    if (isShowing) {
      destroyOverlays()
      createOverlays()
      updateOverlayContent()
    }
  })

  screen.on('display-metrics-changed', () => {
    if (isShowing) {
      destroyOverlays()
      createOverlays()
      updateOverlayContent()
    }
  })

  log.info('Overlay manager initialized')
}

/** 销毁遮罩（应用退出时调用） */
export function destroyAllOverlays(): void {
  stopOverlayTick()
  destroyOverlays()
}

// ─── 内部 ───

function startOverlayTick(): void {
  stopOverlayTick()
  tickInterval = setInterval(() => updateOverlayContent(), 1000)
}

function stopOverlayTick(): void {
  if (tickInterval) {
    clearInterval(tickInterval)
    tickInterval = null
  }
}

function updateOverlayContent(): void {
  const state = timerService.getState()
  const min = Math.floor(state.remaining / 60)
  const sec = state.remaining % 60
  const timeStr = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  broadcastToOverlays(timeStr)
}
