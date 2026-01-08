const { app, BrowserWindow, Tray, Menu, nativeImage, shell, ipcMain, Notification } = require('electron');
const path = require('path');
const Store = require('electron-store');

// 初始化配置存储
const store = new Store({
  defaults: {
    windowBounds: { width: 1200, height: 800 },
    startMinimized: false,
    minimizeToTray: true,
    autoLaunch: false,
    serverUrl: 'https://figochat.manus.space' // FigoChat 正式服务器
  }
});

// 全局变量
let mainWindow = null;
let tray = null;
let isQuitting = false;

// 开发模式检测
const isDev = process.env.NODE_ENV === 'development';

// 服务器 URL
const SERVER_URL = store.get('serverUrl');

/**
 * 创建主窗口
 */
function createWindow() {
  const { width, height, x, y } = store.get('windowBounds');

  mainWindow = new BrowserWindow({
    width,
    height,
    x,
    y,
    minWidth: 800,
    minHeight: 600,
    title: 'FigoChat',
    icon: path.join(__dirname, '../assets/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      spellcheck: true
    },
    show: false, // 先隐藏，等加载完成再显示
    backgroundColor: '#f8f7ff',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    frame: process.platform !== 'darwin'
  });

  // 加载应用
  if (isDev) {
    // 开发模式：加载本地开发服务器
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // 生产模式：加载远程服务器
    mainWindow.loadURL(SERVER_URL);
  }

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    if (!store.get('startMinimized')) {
      mainWindow.show();
    }
  });

  // 保存窗口位置和大小
  mainWindow.on('close', (event) => {
    if (!isQuitting && store.get('minimizeToTray')) {
      event.preventDefault();
      mainWindow.hide();
      return;
    }

    // 保存窗口状态
    if (!mainWindow.isMinimized() && !mainWindow.isMaximized()) {
      store.set('windowBounds', mainWindow.getBounds());
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 在新窗口中打开外部链接
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // 处理导航
  mainWindow.webContents.on('will-navigate', (event, url) => {
    // 允许导航到服务器 URL
    if (!url.startsWith(SERVER_URL) && !url.startsWith('http://localhost')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // 页面加载完成后注入桌面端标识
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(`
      window.__FIGOCHAT_DESKTOP__ = true;
      window.__FIGOCHAT_VERSION__ = '${app.getVersion()}';
      console.log('[FigoChat Desktop] Running version ${app.getVersion()}');
    `);
  });
}

/**
 * 创建系统托盘
 */
function createTray() {
  // 创建托盘图标
  const iconPath = path.join(__dirname, '../assets/tray-icon.png');
  let trayIcon;
  
  try {
    trayIcon = nativeImage.createFromPath(iconPath);
    // macOS 需要 16x16 或 22x22 的图标
    if (process.platform === 'darwin') {
      trayIcon = trayIcon.resize({ width: 16, height: 16 });
    }
  } catch (e) {
    // 如果图标不存在，创建一个空图标
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);
  tray.setToolTip('FigoChat');

  // 托盘菜单
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '打开 FigoChat',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    { type: 'separator' },
    {
      label: '新消息通知',
      type: 'checkbox',
      checked: store.get('notifications', true),
      click: (menuItem) => {
        store.set('notifications', menuItem.checked);
      }
    },
    {
      label: '开机自启动',
      type: 'checkbox',
      checked: store.get('autoLaunch', false),
      click: (menuItem) => {
        store.set('autoLaunch', menuItem.checked);
        setAutoLaunch(menuItem.checked);
      }
    },
    { type: 'separator' },
    {
      label: '设置服务器地址...',
      click: () => {
        // 可以打开设置窗口
        if (mainWindow) {
          mainWindow.show();
          mainWindow.webContents.send('open-settings');
        }
      }
    },
    { type: 'separator' },
    {
      label: '关于 FigoChat',
      click: () => {
        showAboutDialog();
      }
    },
    {
      label: '退出',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  // 点击托盘图标显示/隐藏窗口
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });

  // 双击托盘图标显示窗口
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

/**
 * 设置开机自启动
 */
function setAutoLaunch(enable) {
  app.setLoginItemSettings({
    openAtLogin: enable,
    openAsHidden: true
  });
}

/**
 * 显示关于对话框
 */
function showAboutDialog() {
  const { dialog } = require('electron');
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: '关于 FigoChat',
    message: 'FigoChat 桌面客户端',
    detail: `版本: ${app.getVersion()}\n\n优雅的实时聊天应用\n\n© 2024 FigoChat Team`,
    buttons: ['确定']
  });
}

/**
 * 创建应用菜单
 */
function createAppMenu() {
  const template = [
    ...(process.platform === 'darwin' ? [{
      label: app.name,
      submenu: [
        { role: 'about', label: '关于 FigoChat' },
        { type: 'separator' },
        { role: 'services', label: '服务' },
        { type: 'separator' },
        { role: 'hide', label: '隐藏 FigoChat' },
        { role: 'hideOthers', label: '隐藏其他' },
        { role: 'unhide', label: '显示全部' },
        { type: 'separator' },
        { role: 'quit', label: '退出 FigoChat' }
      ]
    }] : []),
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
        { role: 'selectAll', label: '全选' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '重新加载' },
        { role: 'forceReload', label: '强制重新加载' },
        { type: 'separator' },
        { role: 'resetZoom', label: '重置缩放' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '切换全屏' }
      ]
    },
    {
      label: '窗口',
      submenu: [
        { role: 'minimize', label: '最小化' },
        { role: 'zoom', label: '缩放' },
        ...(process.platform === 'darwin' ? [
          { type: 'separator' },
          { role: 'front', label: '全部置于顶层' }
        ] : [
          { role: 'close', label: '关闭' }
        ])
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '访问官网',
          click: () => shell.openExternal('https://figochat.com')
        },
        {
          label: '反馈问题',
          click: () => shell.openExternal('https://github.com/figochat/desktop/issues')
        },
        { type: 'separator' },
        {
          label: '开发者工具',
          accelerator: process.platform === 'darwin' ? 'Cmd+Option+I' : 'Ctrl+Shift+I',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.toggleDevTools();
            }
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * IPC 通信处理
 */
function setupIPC() {
  // 获取应用版本
  ipcMain.handle('get-version', () => app.getVersion());

  // 获取配置
  ipcMain.handle('get-config', (event, key) => store.get(key));

  // 设置配置
  ipcMain.handle('set-config', (event, key, value) => {
    store.set(key, value);
    return true;
  });

  // 显示原生通知
  ipcMain.handle('show-notification', (event, { title, body, icon }) => {
    if (!store.get('notifications', true)) return false;

    const notification = new Notification({
      title,
      body,
      icon: icon || path.join(__dirname, '../assets/icon.png'),
      silent: false
    });

    notification.on('click', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });

    notification.show();
    return true;
  });

  // 设置托盘图标徽章（未读消息数）
  ipcMain.handle('set-badge', (event, count) => {
    if (process.platform === 'darwin') {
      app.dock.setBadge(count > 0 ? String(count) : '');
    }
    // Windows 可以通过 overlay icon 实现
    if (process.platform === 'win32' && mainWindow) {
      if (count > 0) {
        // 创建带数字的图标
        mainWindow.setOverlayIcon(null, '');
      } else {
        mainWindow.setOverlayIcon(null, '');
      }
    }
    return true;
  });

  // 最小化到托盘
  ipcMain.handle('minimize-to-tray', () => {
    if (mainWindow) {
      mainWindow.hide();
    }
    return true;
  });

  // 退出应用
  ipcMain.handle('quit-app', () => {
    isQuitting = true;
    app.quit();
  });
}

// 应用准备就绪
app.whenReady().then(() => {
  createWindow();
  createTray();
  createAppMenu();
  setupIPC();

  // macOS: 点击 dock 图标时重新创建窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow) {
      mainWindow.show();
    }
  });
});

// 所有窗口关闭时
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 应用退出前
app.on('before-quit', () => {
  isQuitting = true;
});

// 处理证书错误（开发环境）
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (isDev) {
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});

// 单实例锁定
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // 当运行第二个实例时，聚焦到主窗口
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}
