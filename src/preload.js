const { contextBridge, ipcRenderer } = require('electron');

/**
 * FigoChat Desktop API
 * 暴露给渲染进程的安全 API
 */
contextBridge.exposeInMainWorld('figochatDesktop', {
  // 应用信息
  isDesktop: true,
  platform: process.platform,
  
  // 获取版本
  getVersion: () => ipcRenderer.invoke('get-version'),
  
  // 配置管理
  getConfig: (key) => ipcRenderer.invoke('get-config', key),
  setConfig: (key, value) => ipcRenderer.invoke('set-config', key, value),
  
  // 原生通知
  showNotification: (options) => ipcRenderer.invoke('show-notification', options),
  
  // 徽章（未读消息数）
  setBadge: (count) => ipcRenderer.invoke('set-badge', count),
  
  // 窗口控制
  minimizeToTray: () => ipcRenderer.invoke('minimize-to-tray'),
  quitApp: () => ipcRenderer.invoke('quit-app'),
  
  // 事件监听
  onOpenSettings: (callback) => {
    ipcRenderer.on('open-settings', callback);
    return () => ipcRenderer.removeListener('open-settings', callback);
  },
  
  onNewMessage: (callback) => {
    ipcRenderer.on('new-message', callback);
    return () => ipcRenderer.removeListener('new-message', callback);
  }
});

// 页面加载完成后通知主进程
window.addEventListener('DOMContentLoaded', () => {
  console.log('[FigoChat Desktop] Preload script loaded');
  
  // 注入桌面端样式调整
  const style = document.createElement('style');
  style.textContent = `
    /* macOS 标题栏拖拽区域 */
    .desktop-drag-region {
      -webkit-app-region: drag;
    }
    
    .desktop-no-drag {
      -webkit-app-region: no-drag;
    }
    
    /* 桌面端特定样式 */
    body.figochat-desktop {
      /* 可以添加桌面端特定的样式 */
    }
  `;
  document.head.appendChild(style);
  
  // 添加桌面端标识类
  document.body.classList.add('figochat-desktop');
});
