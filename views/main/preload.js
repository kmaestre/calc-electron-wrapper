const { contextBridge, ipcRenderer } = require("electron");

const updateCurrencies = (fn) => {
    ipcRenderer.on('update-currencies', (evt, payload) => {
        fn(payload)
    })
}

contextBridge.exposeInMainWorld("updateCurrencies", updateCurrencies);