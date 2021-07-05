const { contextBridge, ipcRenderer } = require("electron");
const pcName = require('os').hostname()

contextBridge.exposeInMainWorld("pcName", pcName);
contextBridge.exposeInMainWorld("ipcRenderer", ipcRenderer);