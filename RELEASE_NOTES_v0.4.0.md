## 🔧 EyeTimer v0.4.0 — Bug 修复 + 暖色滤镜 + 自动化测试

### 🐛 Bug 修复

#### 1. 统计、提醒、遮罩联动被回调覆盖
- **根因**：`TimerService` 的 `onPhaseEnd` 和 `onStateChange` 使用单回调赋值，后注册的覆盖前面的
- **后果**：番茄记录永远不写入数据库，通知的状态变更永远不触发
- **修复**：改为事件监听器数组模式，所有注册的回调都会被正确调用

#### 2. "强制休息不可跳过"不生效
- **根因**：`timerService.skip()` 和 `TimerPage` 的跳过按钮都不检查 `forcedBreak` 设置
- **修复**：
  - `timerService.skip()` 在休息阶段且 `forcedBreak=true` 时拒绝跳过
  - `TimerPage` 在强制休息期间禁用跳过按钮并显示提示
  - 遮罩窗口的跳过 IPC 也增加了 forcedBreak 检查
  - 保留 3 秒长按 Esc 紧急退出作为唯一绕过方式

#### 3. "暖色滤镜"没有实现
- **新增** `warmFilter` 和 `warmFilterIntensity` 设置项
- 设置页增加「护眼设置」分区，包含开关和强度滑块（10%-80%）
- 使用 CSS filter 实现蓝光过滤效果（sepia + saturate + hue-rotate 组合）
- 设置更改时实时预览，无需重启

### 🧪 自动化测试
- 引入 Vitest 测试框架
- 40 个测试用例覆盖：
  - `timerState`: 状态机转换、阶段计算、时长计算
  - `timerService`: 生命周期、暂停/恢复、跳过/强制休息、多监听器
  - `tipData`: 数据完整性、随机提示、格式化函数
  - `types`: 默认设置完整性和合理性

---
**安装说明**：下载 `EyeTimer-0.4.0-Setup.exe`，双击运行安装。如已安装旧版本，会自动覆盖升级。
