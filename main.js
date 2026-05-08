const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const { EGS_URLS, SOURCES, fetchWithTimeout } = require('./src/constants');
const { searchErogameScape } = require('./src/erogamescape');
const { searchBangumi } = require('./src/bangumi');
const { searchAnison } = require('./src/anison');

const statePath = path.join(app.getPath('userData'), 'window-state.json');
const cachePath = path.join(app.getPath('userData'), 'search-cache.json');
const settingsPath = path.join(app.getPath('userData'), 'settings.json');

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
  const appSettings = loadSettings();
  const defaultSize = (appSettings.windowSize || '900x700').split('x').map(Number);
  const mainWindow = new BrowserWindow({
    width: saved.width || defaultSize[0],
    height: saved.height || defaultSize[1],
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

function loadCache() {
  try {
    if (fs.existsSync(cachePath)) {
      return JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
    }
  } catch (e) {
    console.warn('Failed to load cache:', e.message);
  }
  return {};
}

function saveCache(cache) {
  try {
    fs.writeFileSync(cachePath, JSON.stringify(cache));
  } catch (e) {
    console.warn('Failed to save cache:', e.message);
  }
}

let cache = null;

ipcMain.handle('get-cache', async () => {
  if (!cache) cache = loadCache();
  return cache;
});

ipcMain.handle('set-cache', async (event, { key, results }) => {
  if (!cache) cache = loadCache();
  cache[key] = { results, cachedAt: Date.now() };
  saveCache(cache);
});

ipcMain.handle('clear-cache', async () => {
  cache = {};
  saveCache(cache);
  return Object.keys(cache).length;
});

function loadSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      return JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    }
  } catch (e) {
    console.warn('Failed to load settings:', e.message);
  }
  return {};
}

function saveSettings(settings) {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save settings:', e.message);
  }
}

let settings = null;

ipcMain.handle('get-settings', async () => {
  if (!settings) settings = loadSettings();
  return settings;
});

ipcMain.handle('save-settings', async (event, newSettings) => {
  settings = { ...loadSettings(), ...newSettings };
  saveSettings(settings);
  return settings;
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
