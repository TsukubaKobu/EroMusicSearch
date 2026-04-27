const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { EGS_URLS, SOURCES, fetchWithTimeout } = require('./src/constants');
const { searchErogameScape } = require('./src/erogamescape');
const { searchBangumi } = require('./src/bangumi');
const { searchAnison } = require('./src/anison');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  const warmUp = (url) => fetchWithTimeout(url, { method: 'GET' }).catch(() => { });
  warmUp(EGS_URLS.primary);
  warmUp(EGS_URLS.mirror);

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('search-database', async (event, { source, mode, term, mirrorMode }) => {
  switch (source) {
    case SOURCES.EROGAMESCAPE:
      return await searchErogameScape(term, mode, mirrorMode);
    case SOURCES.BANGUMI:
      return await searchBangumi(term, mode);
    case SOURCES.ANISON:
      return await searchAnison(term, mode);
    default:
      throw new Error(`未知のデータソース: ${source}`);
  }
});
