const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 860,
        icon: path.join(__dirname, 'build', 'icon.ico'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        },
        show: false,
        backgroundColor: '#1a1d23'
    });

    mainWindow.loadFile('index.html');

    // Show window once content is ready to avoid flash
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
