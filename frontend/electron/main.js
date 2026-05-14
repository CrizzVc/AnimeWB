const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const sources = require('./services/sources');
const { animeProvider } = require('./services/providers/animeProvider');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    autoHideMenuBar: true,
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  win.webContents.setWindowOpenHandler((details) => {
    console.log(`Bloqueado popup hacia: ${details.url}`);
    return { action: 'deny' };
  });
}

// IPC Handlers
ipcMain.handle('api-latest', async (event, { sourceId }) => {
  const source = sources.getSource(sourceId);
  return await source.getLatest();
});

ipcMain.handle('api-details', async (event, { url, sourceId }) => {
  const source = sources.getSource(sourceId);
  return await source.getDetails(url);
});

ipcMain.handle('api-servers', async (event, { url, sourceId }) => {
  const source = sources.getSource(sourceId);
  return await source.getServers(url);
});

ipcMain.handle('api-search', async (event, { query, sourceId }) => {
  const source = sources.getSource(sourceId);
  return await source.search(query);
});

ipcMain.handle('api-browse', async (event, { page, sourceId }) => {
  const source = sources.getSource(sourceId);
  return await source.browse(page);
});

ipcMain.handle('api-extract', async (event, { url }) => {
  return await animeProvider.extract(url);
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
