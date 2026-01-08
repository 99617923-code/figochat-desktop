# FigoChat Desktop 桌面客户端

优雅的实时聊天应用桌面版，支持 Windows、macOS 和 Linux。

## 功能特性

- 🖥️ **原生桌面体验**：系统托盘、原生通知、快捷键支持
- 🔄 **自动更新**：内置自动更新功能，始终保持最新版本
- 💬 **实时聊天**：与 Web 版完全同步的聊天功能
- 🔔 **消息通知**：新消息桌面通知提醒
- 🚀 **开机自启**：可选开机自动启动
- 🎨 **优雅界面**：与 Web 版一致的紫色主题设计

## 快速开始

### 1. 安装依赖

```bash
cd desktop
npm install
```

### 2. 配置服务器地址

编辑 `src/main.js`，修改 `serverUrl` 为您的 FigoChat 服务器地址：

```javascript
const store = new Store({
  defaults: {
    serverUrl: 'https://your-figochat-server.com' // 替换为您的服务器地址
  }
});
```

### 3. 生成应用图标

#### 方法一：使用脚本（需要 Node.js 环境）

```bash
npm install sharp
node scripts/generate-icons.js
```

#### 方法二：使用在线工具

1. 打开 `assets/icon.svg` 文件
2. 使用以下在线工具转换：
   - **Windows (.ico)**: https://www.icoconverter.com/
   - **macOS (.icns)**: https://cloudconvert.com/svg-to-icns
3. 将生成的文件保存到 `assets/` 目录

### 4. 开发模式运行

```bash
npm run dev
```

### 5. 打包发布

```bash
# 打包当前平台
npm run build

# 打包 Windows 版本
npm run build:win

# 打包 macOS 版本
npm run build:mac

# 打包 Linux 版本
npm run build:linux

# 打包所有平台
npm run build:all
```

打包完成后，安装包位于 `dist/` 目录。

## 目录结构

```
desktop/
├── assets/              # 资源文件
│   ├── icon.svg         # 源图标（SVG）
│   ├── icon.png         # 主图标（PNG）
│   ├── icon.ico         # Windows 图标
│   ├── icon.icns        # macOS 图标
│   ├── tray-icon.png    # 托盘图标
│   └── icons/           # 各尺寸图标
├── dist/                # 打包输出目录
├── scripts/             # 构建脚本
│   └── generate-icons.js
├── src/
│   ├── main.js          # 主进程
│   ├── preload.js       # 预加载脚本
│   └── updater.js       # 自动更新模块
├── package.json
└── README.md
```

## 配置说明

### 应用配置

配置存储在用户数据目录：
- **Windows**: `%APPDATA%/figochat-desktop/config.json`
- **macOS**: `~/Library/Application Support/figochat-desktop/config.json`
- **Linux**: `~/.config/figochat-desktop/config.json`

可配置项：

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `serverUrl` | string | - | FigoChat 服务器地址 |
| `windowBounds` | object | `{width: 1200, height: 800}` | 窗口大小和位置 |
| `startMinimized` | boolean | `false` | 启动时最小化 |
| `minimizeToTray` | boolean | `true` | 关闭时最小化到托盘 |
| `autoLaunch` | boolean | `false` | 开机自启动 |
| `notifications` | boolean | `true` | 启用通知 |

### 自动更新配置

编辑 `package.json` 中的 `build.publish` 配置：

```json
{
  "build": {
    "publish": {
      "provider": "github",
      "owner": "your-github-username",
      "repo": "figochat-desktop"
    }
  }
}
```

## 桌面端 API

Web 应用可以通过 `window.figochatDesktop` 访问桌面端功能：

```javascript
// 检测是否在桌面端运行
if (window.figochatDesktop) {
  // 获取版本
  const version = await window.figochatDesktop.getVersion();
  
  // 显示原生通知
  await window.figochatDesktop.showNotification({
    title: '新消息',
    body: '您有一条新消息'
  });
  
  // 设置未读消息徽章
  await window.figochatDesktop.setBadge(5);
  
  // 最小化到托盘
  await window.figochatDesktop.minimizeToTray();
}
```

## 使用 GitHub Actions 自动打包

本项目已配置 GitHub Actions，支持自动打包和发布。

### 使用方法

1. **将代码推送到 GitHub 仓库**

```bash
# 初始化 Git 仓库（如果还没有）
git init
git add .
git commit -m "Initial commit"

# 添加远程仓库
git remote add origin https://github.com/你的用户名/figochat-desktop.git
git push -u origin main
```

2. **创建版本标签触发自动打包**

```bash
# 创建版本标签
git tag v1.0.0

# 推送标签到 GitHub
git push origin v1.0.0
```

3. **等待 GitHub Actions 完成**

- 打开 GitHub 仓库的 Actions 页面查看进度
- 打包完成后，安装包会自动发布到 Releases 页面

### 手动触发打包

1. 打开 GitHub 仓库的 Actions 页面
2. 选择 "Build and Release Desktop App" 工作流
3. 点击 "Run workflow" 按钮

### 打包输出

| 平台 | 文件 | 说明 |
|------|------|------|
| Windows | `FigoChat-Setup-x.x.x.exe` | NSIS 安装程序 |
| Windows | `FigoChat-x.x.x-portable.exe` | 便携版 |
| macOS | `FigoChat-x.x.x.dmg` | DMG 安装包 |
| macOS | `FigoChat-x.x.x-mac.zip` | ZIP 压缩包 |
| Linux | `FigoChat-x.x.x.AppImage` | AppImage 格式 |
| Linux | `figochat_x.x.x_amd64.deb` | Debian/Ubuntu 包 |
| Linux | `figochat-x.x.x.x86_64.rpm` | RedHat/Fedora 包 |

## 常见问题

### Q: 如何更改服务器地址？

右键点击系统托盘图标，选择"设置服务器地址"，或直接编辑配置文件。

### Q: macOS 提示"无法打开，因为无法验证开发者"？

这是因为应用未经过 Apple 公证。解决方法：右键点击应用，选择"打开"，或在"系统偏好设置 > 安全性与隐私"中允许打开。

### Q: Windows 提示"Windows 已保护你的电脑"？

点击"更多信息"，然后选择"仍要运行"。建议购买代码签名证书以避免此提示。

## 许可证

MIT License
