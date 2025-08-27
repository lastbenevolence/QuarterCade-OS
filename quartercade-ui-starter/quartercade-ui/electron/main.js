import { app, BrowserWindow } from "electron";
import path from "node:path";
import { startStatsLoop, stopStatsLoop } from "./stats.js";

let win;

function createWindow() {
  win = new BrowserWindow({
    fullscreen: true,
    kiosk: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(process.cwd(), "electron/preload.js"),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const url = process.env.VITE_DEV_SERVER_URL || `file://${path.join(process.cwd(), "dist/index.html")}`;
  win.loadURL(url);

  startStatsLoop((stats) => {
    if (!win?.webContents) return;
    win.webContents.send("qc:stats", stats);
  });
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => { stopStatsLoop(); app.quit(); });