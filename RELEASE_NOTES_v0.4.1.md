# EyeTimer v0.4.1 Release Notes

## Bug Fixes

### 构建失败修复（Critical）
- **添加缺失的 `electron-updater` 依赖**：`updateService.ts` 导入了 `electron-updater` 但未列入 `package.json`，导致 `npm run build` 失败（Rollup resolve error）

### TypeScript 类型错误修复（17 个错误 → 0 个）
- **修复 `recovery.ts` 错误的导入路径**：`./timerTypes` → `../timer/timerTypes`，`./timerState` → `../timer/timerState`
- **修复 `app.isQuitting` 类型冲突**：将 `declare module 'electron'` 模块增强改为独立的 `appState.ts` 共享模块，消除 Duplicate identifier 错误
- **修复 `settingsStore.ts` 类型标注**：`Awaited<ReturnType<typeof import(...)>>` 无效类型改为正确的接口类型
- **添加 `sql.js` 类型声明**：创建 `src/types/sql.js.d.ts`，修复 `database.ts` 和 `sessionStore.ts` 的 implicit any 错误
- **修复 `registerIpc.ts` CSV 导出类型不匹配**：`unknown[]` 回调参数正确类型转换
- **修复 `updateService.ts` 隐式 any**：为 `progress`、`err` 回调参数添加类型注解
- **创建 renderer `env.d.ts`**：补全 `window.api` 全局类型声明，修复渲染进程 30 个 TS 错误
- **同步 preload `env.d.ts`**：补全缺失的 `forcedBreak`、`downloading`、`downloaded`、`onAlertShow` 类型

## Files Changed
- `package.json` — 添加 `electron-updater` 依赖，版本号 → 0.4.1
- `src/main/app/recovery.ts` — 修复导入路径
- `src/main/app/appState.ts` — 新增：应用退出状态共享模块
- `src/main/index.ts` — 移除 module augmentation，使用 appState
- `src/main/tray/trayManager.ts` — 使用 appState
- `src/main/storage/settingsStore.ts` — 修复类型标注
- `src/main/ipc/registerIpc.ts` — 修复类型转换
- `src/main/update/updateService.ts` — 添加回调参数类型
- `src/types/sql.js.d.ts` — 新增：sql.js 类型声明
- `src/preload/env.d.ts` — 补全 API 类型
- `src/renderer/src/env.d.ts` — 新增：渲染进程 window.api 类型
- `tsconfig.node.json` — 添加 `src/types/**/*.d.ts` 到 include
