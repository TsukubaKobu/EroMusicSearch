const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const { EGS_URLS, SOURCES, fetchWithTimeout } = require('./src/constants');
const { searchErogameScape } = require('./src/erogamescape');
const { searchBangumi } = require('./src/bangumi');
const { searchAnison } = require('./src/anison');

const statePath = path.join(app.getPath('userData'), 'window-state.json');

function loadWindowState() {
  try {
    if (fs.existsSync(statePath)) {
      return JSON.parse(fs.readFileSync(statePath, 'utf-8'));
    }
  } catch (e) {
    console.warn('Failed to load window state:', e.message);
  }
  return {};
}

function saveWindowState(win) {
  try {
    const bounds = win.getBounds();
    fs.writeFileSync(statePath, JSON.stringify(bounds));
  } catch (e) {
    console.warn('Failed to save window state:', e.message);
  }
}

function createWindow() {
  const saved = loadWindowState();
  const mainWindow = new BrowserWindow({
    width: saved.width || 900,
    height: saved.height || 700,
    x: saved.x,
    y: saved.y,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('close', () => saveWindowState(mainWindow));

  return mainWindow;
}

app.whenReady().then(() => {
  createWindow();

  const warmUp = (url, label) =>
    fetchWithTimeout(url, { method: 'GET' }).catch((e) =>
      console.warn(`Warm-up failed for ${label}:`, e.message)
    );
  warmUp(EGS_URLS.primary, 'EGS primary');
  warmUp(EGS_URLS.mirror, 'EGS mirror');

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
