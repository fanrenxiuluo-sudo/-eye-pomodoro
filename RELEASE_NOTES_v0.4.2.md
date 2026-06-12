# EyeTimer v0.4.2 Release Notes

## Bug Fixes

### 🔴 Critical: GPU 沙箱崩溃导致应用无法启动
- **问题**: Windows 部分显卡配置（Intel HD 集成显卡等）下，Chromium GPU 沙箱进程反复崩溃，导致应用窗口无法渲染显示
- **错误码**: `exit_code=-2147483645` (0x80000003 STATUS_BREAKPOINT)
- **根因**: GPU 进程沙箱与特定显卡驱动不兼容，重试 8 次后 Electron 放弃并退出
- **修复**: 添加 `disable-gpu-sandbox` 启动参数，禁用 GPU 进程沙箱（对性能影响极小）

### 🟡 托盘菜单"紧急退出休息"功能失效
- **问题**: 强制休息模式下，系统托盘的"🚨 紧急退出休息"按钮点击无效
- **根因**: 调用了 `timerService.skip()`（被 forcedBreak 阻止），应调用 `timerService.emergencySkip()`
- **修复**: 更正为 `emergencySkip()` 调用

### 🟢 番茄计数器硬编码
- **问题**: 番茄计数器始终显示 4 个点，不跟随"几个番茄后长休息"设置
- **修复**: 动态读取 `pomodorosBeforeLongBreak` 设置值

## Files Changed
- `package.json` — 版本号 → 0.4.2
- `src/main/index.ts` — 添加 GPU 沙箱兼容性修复 + 修复步骤编号
- `src/main/tray/trayManager.ts` — 修复紧急退出调用方法
- `src/renderer/src/pages/TimerPage.tsx` — 番茄计数器动态化
- `RELEASE_NOTES_v0.4.1.md` — 更新为完整测试报告

## Test Results
- 自动化测试: 40/40 全部通过
- 功能测试: 全部通过
- 启动验证: 修复后无需 `--no-sandbox` 即可正常启动
