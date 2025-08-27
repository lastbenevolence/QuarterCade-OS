import { app, BrowserWindow } from "electron";
import path from "node:path";

// Optional but helpful in VMs
app.disableHardwareAcceleration();

let win;
function createWindow() {
  win = new BrowserWindow({
    fullscreen: true,
    kiosk: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(process.cwd(), "electron/preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const isDev = !app.isPackaged; // true for `electron .`
  const devURL = process.env.VITE_DEV_SERVER_URL || "http://localhost:5173/";
  const prodURL = `file://${path.join(process.cwd(), "dist/index.html")}`;

  win.loadURL(isDev ? devURL : prodURL);

  // TEMP: open devtools so we can see console errors if any
  if (isDev) win.webContents.openDevTools();
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());