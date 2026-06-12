/**
 * 应用级共享状态
 *
 * 避免在 Electron 的 App 接口上做 module augmentation（易导致类型冲突），
 * 改用简单的模块级变量。
 */

let _isQuitting = false

export function setQuitting(value: boolean): void {
  _isQuitting = value
}

export function isQuitting(): boolean {
  return _isQuitting
}
