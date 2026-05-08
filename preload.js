const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  searchDatabase: (args) => ipcRenderer.invoke('search-database', args),
  getCache: () => ipcRenderer.invoke('get-cache'),
  setCache: (key, results) => ipcRenderer.invoke('set-cache', { key, results }),
  clearCache: () => ipcRenderer.invoke('clear-cache'),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
});
