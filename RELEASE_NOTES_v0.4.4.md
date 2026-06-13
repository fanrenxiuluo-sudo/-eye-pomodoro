# EyeTimer v0.4.4 Release Notes

## Bug Fixes

### 后台最小化后专注结束提醒不明显
- 问题：用户开始专注后将窗口最小化，专注时间结束时没有稳定恢复窗口，也缺少明确的后台系统提醒。
- 根因：窗口处于最小化状态时只调用 `show()` 和 `focus()`，没有先调用 `restore()`；系统通知主要依赖状态变更，在阶段结束事件本身没有立即通知。
- 修复：阶段结束时先恢复最小化窗口，再显示、聚焦并触发任务栏闪烁。
- 修复：专注结束和休息结束都在阶段结束事件中立即发送系统通知。
- 修复：PowerShell 声音播放改为 `PlaySync()`，防止播放进程退出导致提示音被截断。

## Files Changed
- `package.json` / `package-lock.json` - 版本号更新到 `0.4.4`
- `src/main/notification/notificationService.ts` - 修复最小化窗口恢复与阶段结束系统通知
- `src/main/utils/soundManager.ts` - 修复后台提示音播放完整性

## Test Results
- 自动化测试：40/40 全部通过
- 生产构建：通过
