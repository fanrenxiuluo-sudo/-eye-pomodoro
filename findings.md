# EyeTimer v0.3.0 — 研究发现

## 护眼权威指南研究

### 20-20-20 法则
- **来源**: 美国眼科学会 (AAO)、美国验光学会 (AOA)
- **规则**: 每 20 分钟，看 20 英尺（约 6 米）以外的物体，持续 20 秒
- **原理**: 缓解调节痉挛，放松睫状肌
- **URL**: https://www.aao.org/eye-health/tips-prevention/computer-usage

### 数字眼疲劳 (Digital Eye Strain / CVS)
- **来源**: AAO, Vision Council
- **建议**:
  - 屏幕距离：手臂长度（50-70cm）
  - 屏幕亮度：与环境光匹配
  - 眨眼频率：正常使用 15-20 次/分钟，看屏幕时降至 5-7 次
  - 环境光线：避免屏幕与环境亮度对比过大

### 眼保健操 / 眼部运动
- **来源**: 中国眼科学会、国际眼科研究
- **有效动作**:
  1. 远近交替对焦（Near-far focusing）：拇指放在 15cm 处，交替看拇指和远处
  2. 眼球运动（Eye rolling）：缓慢转动眼球，上下左右各看 5 秒
  3. 掌心热敷（Palming）：搓热双手，轻敷眼睛 30 秒
  4. 眨眼练习（Blinking exercise）：快速眨眼 20 次
  5. 8 字运动：眼球画大 8 字形

### 长休息建议（15-30 分钟）
- **来源**: WHO 眼健康指南、中国医师协会眼科分会
- **建议**:
  1. 离开座位，走动 5 分钟
  2. 看看窗外远处的绿色植物
  3. 做完整的眼保健操（约 5 分钟）
  4. 喝一杯水，保持身体水分
  5. 站立伸展，活动肩颈

---

## 代码结构发现

### 当前提示音实现
- 文件: `src/main/utils/soundManager.ts`
- 使用正弦波合成 WAV（`wav.ts` 中的 `generateMelody`）
- 通过 PowerShell SoundPlayer 播放
- **问题**: SoundPlayer 音量不受应用控制，且系统音量可能很低

### 当前 overlay 实现
- 文件: `src/main/overlay/overlayManager.ts`
- 全屏 BrowserWindow，深色半透明背景
- 只有一条随机 tip，无区分短/长休息
- **问题**: 内容太少，无科学依据

### electron-updater 配置
- `electron-builder.yml` 中 publish 配置指向 GitHub
- `updateService.ts` 已实现完整的事件监听
- **问题**: 可能缺少 `provider: github` 的正确 GitHub Token 配置
  - 对于公开仓库，electron-updater 可以从 Releases 读取，但需要正确的格式

---

## UI 设计方案

### TimerPage 设计目标
- 渐变背景（深蓝→深紫）
- 毛玻璃卡片效果 (backdrop-filter)
- 更大的圆环，更精细的动画
- 状态文字改为图标+文字组合
- 按钮增加悬浮反馈

### 配色升级
- 深色主题：从纯深蓝 → 带紫调的深色，更有科技感
- 强调色：保留蓝色主调，增加渐变变化
- 增加发光效果（glow）用于活跃状态
