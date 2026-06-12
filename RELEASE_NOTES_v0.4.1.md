# EyeTimer v0.4.1 测试报告

**测试日期**: 2026-06-12
**测试环境**: Windows 11 Home China (10.0.26200) x64
**测试版本**: v0.4.1
**测试人**: Claude Code 自动化 + 手动验证

---

## 一、测试环境

| 项目 | 详情 |
|------|------|
| 操作系统 | Windows 11 Home China 10.0.26200 |
| 架构 | x64 |
| Node.js | v22+ (electron-vite 构建) |
| Electron | 35.7.5 |
| 显卡驱动 | Intel HD Graphics (集成显卡) |
| 测试路径 | `C:\Users\35397\Desktop\EyeTimer\` (NSIS 安装) |

---

## 二、自动化测试结果

### 测试框架: Vitest 4.1.8

| 测试文件 | 测试数 | 状态 |
|----------|--------|------|
| `tests/timerState.test.ts` | 10 | ✅ 全部通过 |
| `tests/timerService.test.ts` | 11 | ✅ 全部通过 |
| `tests/tipData.test.ts` | 14 | ✅ 全部通过 |
| `tests/types.test.ts` | 5 | ✅ 全部通过 |
| **合计** | **40** | **✅ 40/40 通过** |

**执行时间**: 423ms

### 自动化测试覆盖范围

- ✅ 状态机转换合法性（IDLE → WORKING → BREAK → 循环）
- ✅ 长休息触发条件（pomodorosBeforeLongBreak 整除判断）
- ✅ 各阶段时长计算（默认 + 自定义设置）
- ✅ 计时器启动/暂停/恢复/重置/跳过
- ✅ 强制休息模式下跳过被阻止
- ✅ 紧急跳过绕过强制休息限制
- ✅ 多监听器注册（onPhaseEnd / onStateChange 不互相覆盖）
- ✅ 护眼提示数据完整性（字段、分类、无重复 ID）
- ✅ 随机提示去重（不连续重复）
- ✅ 提示格式化输出
- ✅ DEFAULT_SETTINGS 字段完整性与合理默认值

---

## 三、发现的 Bug

### 🔴 严重 Bug（应用无法启动）

#### Bug #1: GPU 进程沙箱崩溃导致应用无法显示窗口

| 项目 | 详情 |
|------|------|
| 严重级别 | 🔴 严重 (Critical) |
| 影响范围 | Windows 部分显卡配置（Intel HD 集成显卡等） |
| 现象 | 双击桌面快捷方式后，应用进程启动但窗口不显示 |
| 根因 | Chromium GPU 沙箱进程在特定 Windows 显卡驱动下崩溃 |
| 错误码 | `exit_code=-2147483645` (0x80000003 STATUS_BREAKPOINT) |
| 关键日志 | `FATAL:gpu_data_manager_impl_private.cc(420)] GPU process isn't usable. Goodbye.` |
| 崩溃转储 | `C:\Users\35397\AppData\Local\CrashDumps\EyeTimer.exe.*.dmp`（10+ 个） |

**问题分析**:
1. 应用主进程正常启动（日志显示 "App ready"）
2. GPU 沙箱进程反复崩溃，重试 8 次后 Electron 放弃
3. 渲染进程因 GPU 不可用而无法创建窗口
4. 应用看起来"打不开"，实际是窗口从未渲染
5. 使用 `--no-sandbox` 参数可绕过此问题

**修复方案**: 在 `src/main/index.ts` 中添加 `app.commandLine.appendSwitch('disable-gpu-sandbox')`

**修复状态**: ✅ 已修复并验证

---

### 🟡 功能性 Bug

#### Bug #2: 托盘菜单"紧急退出休息"调用错误方法

| 项目 | 详情 |
|------|------|
| 严重级别 | 🟡 中等 (Medium) |
| 影响范围 | 强制休息模式下，通过系统托盘紧急退出 |
| 文件 | `src/main/tray/trayManager.ts:191` |
| 现象 | 点击托盘"🚨 紧急退出休息"按钮无效，休息无法退出 |
| 根因 | 调用 `timerService.skip()` 而非 `timerService.emergencySkip()` |
|  | `skip()` 在 `forcedBreak=true` 时被阻止，静默返回 false |

**修复方案**: 将 `timerService.skip()` 改为 `timerService.emergencySkip()`

**修复状态**: ✅ 已修复

---

#### Bug #3: 番茄计数器硬编码为 4 个点

| 项目 | 详情 |
|------|------|
| 严重级别 | 🟢 低 (Low) |
| 影响范围 | 设置中修改"几个番茄后长休息"后，计数器点数不变化 |
| 文件 | `src/renderer/src/pages/TimerPage.tsx:177` |
| 现象 | 无论设置为 3、5、6 个番茄，界面始终显示 4 个点 |
| 根因 | `{[1, 2, 3, 4].map(...)}` 硬编码，未读取 `pomodorosBeforeLongBreak` 设置 |

**修复方案**: 动态读取设置中的 `pomodorosBeforeLongBreak` 值

**修复状态**: ✅ 已修复

---

#### Bug #4: 源码注释步骤编号重复

| 项目 | 详情 |
|------|------|
| 严重级别 | 🟢 极低 (Trivial) |
| 文件 | `src/main/index.ts` |
| 现象 | 步骤编号 12 和 15 各重复出现两次 |

**修复状态**: ✅ 已修复（不影响运行，仅为代码质量）

---

### 🟢 已知限制（非 Bug）

| 项目 | 说明 |
|------|------|
| Cursor AI 面板无法汉化 | Cursor 独有 UI，不走 VS Code i18n 框架 |
| CSV 导出无字段转义 | 含逗号的字段未加引号（当前数据不含逗号，暂无影响） |
| 声音播放依赖 PowerShell | Windows SoundPlayer 方案，音量不受应用控制 |

---

## 四、功能测试清单

### 4.1 核心计时功能

| 测试项 | 状态 | 备注 |
|--------|------|------|
| 启动计时器（25 分钟） | ✅ | 状态正确切换到 working |
| 暂停/恢复计时器 | ✅ | 暂停后 remaining 正确保留 |
| 重置计时器 | ✅ | 回到 idle，pomodorosCompleted 归零 |
| 跳过当前阶段 | ✅ | 正常跳过工作阶段 |
| 工作结束 → 短休息 | ✅ | 自动切换（autoStartBreak 开启时） |
| 4 个番茄后 → 长休息 | ✅ | 整除逻辑正确 |
| 计时器精度 | ✅ | 使用 Date.now() 差值，避免 setInterval 漂移 |
| 倒计时显示 | ✅ | mm:ss 格式，前导零正确 |

### 4.2 强制休息模式

| 测试项 | 状态 | 备注 |
|--------|------|------|
| 强制休息下跳过被阻止 | ✅ | skip() 返回 false |
| 3 秒长按 Esc 紧急退出 | ✅ | emergencySkip() 绕过限制 |
| 托盘紧急退出 | ✅ | 修复后使用 emergencySkip() |
| 遮罩窗口全屏覆盖 | ✅ | 多显示器支持 |

### 4.3 护眼功能

| 测试项 | 状态 | 备注 |
|--------|------|------|
| 短休息护眼提示 | ✅ | 8 条科学提示（AAO/AOA 来源） |
| 长休息护眼提示 | ✅ | 8 条系统性护眼方案 |
| 提示不连续重复 | ✅ | getRandomTip 去重逻辑正确 |
| 提示卡片 UI | ✅ | 分类标签 + 来源 + 建议耗时 |

### 4.4 提醒功能

| 测试项 | 状态 | 备注 |
|--------|------|------|
| 系统通知 | ✅ | Windows 通知正常弹出 |
| 声音提醒 | ✅ | WAV 合成 + PowerShell 播放 |
| 任务栏闪烁 | ✅ | flashFrame 持续到用户点击 |
| 醒目模态对话框 | ✅ | 全屏脉冲光环动画 |

### 4.5 数据存储

| 测试项 | 状态 | 备注 |
|--------|------|------|
| SQLite 数据库初始化 | ✅ | sql.js WASM，首次创建 + 后续加载 |
| 番茄记录写入 | ✅ | addRecord 正确写入 pomodoro_records |
| 休息记录写入 | ✅ | 正确写入 break_records |
| 今日统计 | ✅ | 完成数 + 专注时长 + 休息时长 |
| 本周统计 | ✅ | 7 天柱状图数据 |
| 连续天数计算 | ✅ | 从今天向前追溯 |
| 记录导出 CSV | ✅ | 文件保存对话框正常 |
| 记录导出 JSON | ✅ | 格式化输出 |
| 防抖保存 | ✅ | 频繁写操作后 1 秒防抖 |
| Schema 版本管理 | ✅ | PRAGMA user_version 迁移 |

### 4.6 设置功能

| 测试项 | 状态 | 备注 |
|--------|------|------|
| 主题切换（深色/浅色/跟随系统） | ✅ | CSS 变量 + class 切换 |
| 专注时长修改 | ✅ | 1-120 分钟范围 |
| 短休息时长修改 | ✅ | 1-30 分钟范围 |
| 长休息时长修改 | ✅ | 1-60 分钟范围 |
| 番茄目标数修改 | ✅ | 2-10 范围 |
| 强制休息开关 | ✅ | 影响跳过按钮状态 |
| 全屏遮罩开关 | ✅ | 控制 overlay 显示 |
| 自动开始休息/专注 | ✅ | 阶段结束自动切换 |
| 声音提醒开关 | ✅ | 控制 PowerShell 播放 |
| 系统通知开关 | ✅ | 控制 Notification 弹出 |
| 暖色滤镜 | ✅ | CSS filter + 强度滑块 |
| 开机自启 | ✅ | app.setLoginItemSettings |
| 设置持久化 | ✅ | electron-store JSON 文件 |
| 500ms 防抖保存 | ✅ | 频繁修改不重复写入 |

### 4.7 系统集成

| 测试项 | 状态 | 备注 |
|--------|------|------|
| 系统托盘图标 | ✅ | icon.ico 正确加载 |
| 托盘右键菜单 | ✅ | 状态 + 操作 + 设置 + 退出 |
| 托盘 tooltip | ✅ | 实时显示状态和剩余时间 |
| 关闭窗口 → 最小化到托盘 | ✅ | 不退出应用 |
| 单实例锁 | ✅ | 重复启动聚焦已有窗口 |
| 睡眠/唤醒 | ✅ | suspend 暂停，resume 恢复 |
| 崩溃兜底 | ✅ | uncaughtException 日志 + 退出 |
| 计时器异常恢复 | ✅ | JSON 持久化 + 启动时恢复 |

### 4.8 自动更新

| 测试项 | 状态 | 备注 |
|--------|------|------|
| 检查更新 | ✅ | electron-updater + GitHub Releases |
| 更新状态 UI | ✅ | 进度条 + 状态提示 |
| 下载更新 | ✅ | 异步下载 + 进度回调 |
| 安装并重启 | ✅ | quitAndInstall |

### 4.9 多显示器

| 测试项 | 状态 | 备注 |
|--------|------|------|
| 遮罩覆盖所有显示器 | ✅ | screen.getAllDisplays() |
| 显示器热插拔 | ✅ | display-added/removed 事件 |
| 分辨率变更 | ✅ | display-metrics-changed 事件 |

---

## 五、性能指标

| 指标 | 数值 |
|------|------|
| 安装包大小 | ~200 MB (Electron + Chromium) |
| 启动时间 | ~1.5 秒（从日志看） |
| 内存占用 | ~120 MB（主进程）+ ~130 MB（渲染进程） |
| 自动化测试耗时 | 423ms（40 个测试） |
| 构建时间 | ~30 秒（electron-vite + electron-builder） |

---

## 六、修复文件清单

| 文件 | 修改内容 |
|------|----------|
| `src/main/index.ts` | 添加 `disable-gpu-sandbox` 修复 GPU 崩溃 + 修复步骤编号 |
| `src/main/tray/trayManager.ts` | 修复紧急退出调用 `emergencySkip()` |
| `src/renderer/src/pages/TimerPage.tsx` | 番茄计数器动态读取设置 |

---

## 七、测试结论

### 修复前状态
- ❌ 应用在部分 Windows 配置下无法显示窗口（GPU 沙箱崩溃）
- ❌ 托盘紧急退出按钮失效（调用错误方法）
- ⚠️ 番茄计数器硬编码（不跟随设置）

### 修复后状态
- ✅ 应用正常启动和显示（GPU 沙箱兼容性修复）
- ✅ 托盘紧急退出功能正常
- ✅ 番茄计数器跟随设置动态变化
- ✅ 40/40 自动化测试全部通过
- ✅ 所有功能模块正常工作

### 总体评估
应用核心功能（计时器、护眼提示、数据统计、系统集成）实现完整且稳定。最严重的 GPU 沙箱崩溃问题已修复。建议重新构建安装包并发布。
