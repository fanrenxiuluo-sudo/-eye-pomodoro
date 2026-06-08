/**
 * Timer tick 事件数据（每秒发送给渲染进程）
 */
export interface TimerTickData {
  remaining: number // 剩余秒数
  total: number // 当前阶段总秒数
  phase: string // 当前阶段
  pomodorosCompleted: number // 已完成番茄数
}

/**
 * Timer 状态变更事件数据（阶段切换时发送）
 */
export interface TimerStateData {
  phase: string
  remaining: number
  total: number
  pomodorosCompleted: number
}

/**
 * 计时器持久化状态（写入 JSON 文件，用于异常恢复）
 */
export interface SavedTimerState {
  schemaVersion: number
  phase: string // PhaseState 枚举值
  endTs: number | null // 运行中: 结束时间戳; 暂停/空闲: null
  remainingSec: number // 暂停时的剩余秒数; 运行中为 0
  pomodorosCompleted: number
  savedAt: number // 保存时的 Date.now()
}
