import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("qc", {
  onSystemStats: (cb) => {
    const handler = (_evt, payload) => cb(payload);
    ipcRenderer.on("qc:stats", handler);
    return () => ipcRenderer.off("qc:stats", handler);
  }
});