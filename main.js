const { app, BrowserWindow, Menu, globalShortcut } = require('electron');
const path = require('path');

let mainWindow;
let fileToOpen = null;

// Grab file path from command-line args (file association / double-click)
function extractFileArg(argv) {
    for (let i = 1; i < argv.length; i++) {
        const arg = argv[i];
        if (arg && !arg.startsWith('-') && /\.(x|hxx|obj|stl|glb|gltf)$/i.test(arg)) {
            return arg;
        }
    }
    return null;
}

fileToOpen = extractFileArg(process.argv);

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 860,
        icon: path.join(__dirname, 'build', 'icon.ico'),
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            devTools: false,
            preload: path.join(__dirname, 'preload.js')
        },
        show: false,
        backgroundColor: '#1a1d23'
    });

    // Remove the application menu entirely
    Menu.setApplicationMenu(null);

    mainWindow.loadFile('index.html');

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        // If launched with a file argument, send it to the renderer
        if (fileToOpen) {
            mainWindow.webContents.send('open-file', fileToOpen);
            fileToOpen = null;
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    createWindow();

    // Block DevTools keyboard shortcuts
    globalShortcut.register('F12', () => {});
    globalShortcut.register('CommandOrControl+Shift+I', () => {});
    globalShortcut.register('CommandOrControl+Shift+J', () => {});
    globalShortcut.register('CommandOrControl+Shift+C', () => {});
});

// Windows: second-instance handles file association when app is already running
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
    app.quit();
} else {
    app.on('second-instance', (event, argv) => {
        const filePath = extractFileArg(argv);
        if (filePath && mainWindow) {
            mainWindow.webContents.send('open-file', filePath);
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });
}

app.on('window-all-closed', () => {
    app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
