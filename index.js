const { app, BrowserWindow, dialog, ipcMain } = require('electron')
const fs = require('fs')
const path = require('path')
const { homedir, hostname } = require('os')
let validationPath = path.join(homedir(), '/AppData/CalculadoraApuestas/')
let validationFilePath = path.join(validationPath, 'application.json')

function createMainWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    title: 'main-window',
    maximizable: false,
    show: false
  })

  win.menuBarVisible = false
  win.loadFile(path.join(__dirname, '/views/main.html'))
  win.once('ready-to-show', () => {
    win.show()
  })
}

function createActivationWindow() {
  const win = new BrowserWindow({
    width: 300,
    height: 150,
    show: false,
    title: 'activation',
    /*minimizable: false,
    maximizable: false,
    resizable: false,
    */
    webPreferences: {
      preload: path.join(__dirname, '/views/preload.js')
    }
  })

  win.menuBarVisible = false
  win.loadFile('./views/activation.html')
  win.once('ready-to-show', () => {
    win.show()
  })
  ipcMain.handle('successfull-activation', (event, { email, pcName }) => {
    if (!fs.existsSync(validationPath)) fs.mkdirSync(validationPath)
    fs.writeFileSync(validationFilePath, `{"email":"${email}","deviceName":"${pcName}"}`)
    createMainWindow()
    win.close()
  })
}

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

app.whenReady().then(() => {
  if (!fs.existsSync(validationFilePath)) createActivationWindow()
  else {
    let validationData = fs.readFileSync(validationFilePath)
    if (validationData && JSON.parse(validationData).deviceName == hostname()) createMainWindow()
    else {
      dialog.showErrorBox('Error!', 'mamalo perro')
      app.quit()
    }
  }
})