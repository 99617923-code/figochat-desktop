const { autoUpdater } = require('electron-updater');
const { dialog, BrowserWindow } = require('electron');

/**
 * 自动更新模块
 */
class AppUpdater {
  constructor() {
    this.isChecking = false;
    this.updateAvailable = false;
    
    // 配置自动更新
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;
    
    // 设置事件监听
    this.setupEventListeners();
  }

  setupEventListeners() {
    // 检查更新出错
    autoUpdater.on('error', (error) => {
      console.error('[Updater] Error:', error);
      this.isChecking = false;
    });

    // 检查更新中
    autoUpdater.on('checking-for-update', () => {
      console.log('[Updater] Checking for updates...');
      this.isChecking = true;
    });

    // 有可用更新
    autoUpdater.on('update-available', (info) => {
      console.log('[Updater] Update available:', info.version);
      this.isChecking = false;
      this.updateAvailable = true;
      
      this.showUpdateDialog(info);
    });

    // 没有可用更新
    autoUpdater.on('update-not-available', (info) => {
      console.log('[Updater] No update available');
      this.isChecking = false;
      this.updateAvailable = false;
    });

    // 下载进度
    autoUpdater.on('download-progress', (progress) => {
      const mainWindow = BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        mainWindow.setProgressBar(progress.percent / 100);
        mainWindow.webContents.send('update-progress', progress);
      }
    });

    // 下载完成
    autoUpdater.on('update-downloaded', (info) => {
      console.log('[Updater] Update downloaded');
      
      const mainWindow = BrowserWindow.getAllWindows()[0];
      if (mainWindow) {
        mainWindow.setProgressBar(-1); // 移除进度条
      }
      
      this.showInstallDialog(info);
    });
  }

  /**
   * 检查更新
   */
  async checkForUpdates(silent = true) {
    if (this.isChecking) return;
    
    try {
      const result = await autoUpdater.checkForUpdates();
      
      if (!silent && !this.updateAvailable) {
        dialog.showMessageBox({
          type: 'info',
          title: '检查更新',
          message: '当前已是最新版本',
          buttons: ['确定']
        });
      }
      
      return result;
    } catch (error) {
      console.error('[Updater] Check failed:', error);
      
      if (!silent) {
        dialog.showMessageBox({
          type: 'error',
          title: '检查更新失败',
          message: '无法连接到更新服务器，请稍后重试',
          buttons: ['确定']
        });
      }
    }
  }

  /**
   * 显示更新对话框
   */
  showUpdateDialog(info) {
    const options = {
      type: 'info',
      title: '发现新版本',
      message: `FigoChat ${info.version} 已发布`,
      detail: `当前版本: ${require('electron').app.getVersion()}\n新版本: ${info.version}\n\n是否立即下载更新？`,
      buttons: ['立即下载', '稍后提醒'],
      defaultId: 0,
      cancelId: 1
    };

    dialog.showMessageBox(options).then(({ response }) => {
      if (response === 0) {
        autoUpdater.downloadUpdate();
      }
    });
  }

  /**
   * 显示安装对话框
   */
  showInstallDialog(info) {
    const options = {
      type: 'info',
      title: '更新已就绪',
      message: '新版本已下载完成',
      detail: '重启应用以完成更新安装',
      buttons: ['立即重启', '稍后重启'],
      defaultId: 0,
      cancelId: 1
    };

    dialog.showMessageBox(options).then(({ response }) => {
      if (response === 0) {
        autoUpdater.quitAndInstall(false, true);
      }
    });
  }
}

module.exports = new AppUpdater();
