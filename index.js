const { app, BrowserWindow, dialog, ipcMain } = require('electron')
const fs = require('fs')
const path = require('path')
const { homedir, hostname, networkInterfaces } = require('os')
const { execSync } = require('child_process')
const validationPath = path.join(homedir(), '/AppData/CalculadoraApuestas/')
const validationFilePath = path.join(validationPath, 'application.json')

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

function getMACs() {
  return execSync('getmac /fo csv /nh', { encoding: 'utf-8' }).match(/\"(([A-Z0-9]{2,2})\-)+([A-Z0-9]{2,2})\"/g).join(',').replaceAll('"', '').split(',')
}

function compareMACs(jsonMACs) {
  let pc = getMACs()
  let res = false
  let i = 0
  while (!res) {
    res = (jsonMACs.indexOf(pc[i]) >= 0) ? true : false
    i++
  }

  return res
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
    let macs = getMACs()
    if (!fs.existsSync(validationPath)) fs.mkdirSync(validationPath)
    fs.writeFileSync(validationFilePath, `{"email":"${email}","deviceName":"${pcName}", "macs": ${JSON.stringify(macs)}}`)
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
    let validationData = JSON.parse(fs.readFileSync(validationFilePath))
    
    if (validationData && validationData.deviceName == hostname() && compareMACs(validationData.macs)) {
      createMainWindow()
    } else {
      dialog.showErrorBox('Error!', 'mamalo perro')
      app.quit()
    }
  }
})