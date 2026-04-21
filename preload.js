const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  searchDatabase: (args) => ipcRenderer.invoke('search-database', args)
});
