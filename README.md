# EyeTimer 护眼番茄钟

Windows 桌面护眼番茄钟应用 — 定时休息提醒，保护眼睛。

## 功能

- 🍅 番茄钟计时（工作 → 短休息 → 长休息循环）
- 🛡️ 全屏休息遮罩（多显示器支持）
- 👁️ 护眼视觉覆盖层（透明 BrowserWindow 暖色滤镜）
- 🔔 Windows 原生通知
- 🔊 提醒音效
- 📊 专注统计（每日/每周图表）
- ⚙️ 完整设置中心
- 🖥️ 系统托盘后台运行
- 📦 Windows 安装包

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
