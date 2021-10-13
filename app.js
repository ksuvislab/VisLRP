const { app, BrowserWindow, globalShortcut } = require('electron');
const path = require('path');

// Handle shortcuts on windows
if (require('electron-squirrel-startup')) {
    app.quit();
}

// Global reference of window object
let mainWindow;

function createWindow () {
    // Create browser window
    mainWindow = new BrowserWindow({
        width: 1480,
        height: 920,
        minWidth: 1400,
        minHeight: 900,
        webPreferences: {
            nodeIntegration: true
        }
    });

    // Load index.html of the app
    mainWindow.loadURL(path.join('file://',__dirname, 'src', 'html', 'index.html'));

    // Disable menu bar when window started
    mainWindow.once('ready-to-show', function () {
            mainWindow.setMenu(null);
            mainWindow.show();
    });

    // Emit when the window is closed
    mainWindow.on('closed', function () {
        //  Dereference window object
        mainWindow = null;
    });

    // Enable DevTools
    mainWindow.removeMenu();
    //mainWindow.setFullScreen(true);
    enableDevtools();
}

// Enable developer tools for debugging
function enableDevtools () {
    // Detecting os and change keys
    if (process.platform === 'darwin') {
        globalShortcut.register('Command + Shift + I', function () {
            mainWindow.webContents.openDevTools();
        });
    } else if (process.platform === 'linux' || process.platform === 'win32') {
        globalShortcut.register('Control + Shift + I', function () {
            mainWindow.webContents.openDevTools();
        });
    }
}

// Initialize electron and create browser windows
app.on('ready', createWindow);

// Quit when all windows are closed
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    // Recreate window in the app when dock icon is clicked
    if (mainWindow === null) {
        createWindow();
    }
});