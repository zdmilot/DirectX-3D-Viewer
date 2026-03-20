const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    onOpenFile: (callback) => ipcRenderer.on('open-file', (event, filePath) => callback(filePath))
});
