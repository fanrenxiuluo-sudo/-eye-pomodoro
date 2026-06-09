# EyeTimer 护眼番茄钟

Windows 桌面护眼番茄钟应用 — 基于权威眼科研究的定时休息提醒，保护眼睛。

## 功能

- 🍅 番茄钟计时（工作 → 短休息 → 长休息循环）
- 🧠 **权威护眼休息指导**（基于 AAO 20-20-20 法则、眼科协会建议）
- ⏰ **醒目提醒系统**（全屏弹窗 + 任务栏闪烁 + 增强提示音）
- 🛡️ 全屏休息遮罩（多显示器支持 + 护眼提示卡片）
- 👁️ 护眼视觉覆盖层（透明 BrowserWindow 暖色滤镜）
- 🔔 Windows 原生通知
- 🔊 增强提醒音效（音量提升 + 复杂旋律 + 多次重复）
- 📊 专注统计（每日/每周图表）
- ⚙️ 完整设置中心
- 🖥️ 系统托盘后台运行
- 📦 应用内自动更新（检查 → 下载 → 一键安装）
- 🎨 现代 UI（毛玻璃卡片、渐变背景、微动效）

## 技术栈

- Electron 35
- React 19
- TypeScript
- electron-vite
- SQLite（sql.js）
- Recharts

## 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 打包 Windows 安装包
npm run build:win
```

## 项目结构

```
src/
├─ main/              # 主进程
├─ preload/           # Preload 脚本
├─ renderer/          # React 前端
└─ shared/            # 共享类型
```

## License

MIT
