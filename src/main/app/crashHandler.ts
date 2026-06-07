import log from 'electron-log'

/**
 * 注册全局崩溃兜底处理器
 *
 * 捕获未处理的异常和 Promise 拒绝，记录日志后退出进程。
 * 遮罩窗口残留、状态卡死等问题由 recovery 模块在下次启动时清理。
 */
export function registerCrashHandler(): void {
  process.on('uncaughtException', (error) => {
    log.error('UncaughtException:', error)
    // 给日志写入一点时间
    setTimeout(() => process.exit(1), 500)
  })

  process.on('unhandledRejection', (reason) => {
    log.error('UnhandledRejection:', reason)
  })

  process.on('SIGINT', () => {
    log.info('Process SIGINT received')
    process.exit(0)
  })
}
