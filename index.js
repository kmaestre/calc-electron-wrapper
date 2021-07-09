const { app, BrowserWindow, dialog, ipcMain } = require('electron')
const fs = require('fs')
const path = require('path')
const { homedir, hostname } = require('os')
const { execSync } = require('child_process')
const validationPath = path.join(homedir(), '/AppData/CalculadoraApuestas/')
const validationFilePath = path.join(validationPath, 'application.json')
const finance = require('yahoo-finance2').default
const { sign, verify } = require('jsonwebtoken')


function createMainWindow() {
  const win = new BrowserWindow({
    width: 700,
    minWidth: 700,
    maxWidth: 700,
    title: 'Calculadora',
    maximizable: true,
    resizable: false,
    show: false,
    useContentSize: true,
    icon: './goat-logo.ico',
    webPreferences: {
      devTools: false,
      preload: path.join(__dirname, '/views/main/preload.js')
    }
  })
  win.setAspectRatio(4 / 3)
  win.menuBarVisible = false
  win.loadFile(path.join(__dirname, '/views/main/index.html'))
  win.once('ready-to-show', async () => {
    win.show()
    await fetchCurrencyData(win)
    setInterval(() => fetchCurrencyData(win), 60000);
  })

}

async function fetchCurrencyData(win) {
  try {
    let res = await finance.quote(['PEN=X', 'EUR=X', 'PENUSD=X', 'PENEUR=X'])
    let currencyObj = {}

    res.forEach(({ regularMarketPrice, symbol }) => {
      if (symbol == 'PEN=X') currencyObj.USDPEN = { value: regularMarketPrice, symbol }
      if (symbol == 'EUR=X') currencyObj.USDEUR = { value: regularMarketPrice, symbol }
      if (symbol == 'PENUSD=X') currencyObj.PENUSD = { value: regularMarketPrice, symbol }
      if (symbol == 'PENEUR=X') currencyObj.PENEUR = { value: regularMarketPrice, symbol }
    })

    win.webContents.postMessage('update-currencies', currencyObj)
  } catch (err) {
    win.webContents.postMessage('update-currencies')
    console.error('could not fetch data from finance')
  }

}

function getMACs() {
  return execSync('getmac /fo csv /nh', { encoding: 'utf-8' }).match(/\"(([A-Z0-9]{2,2})\-)+([A-Z0-9]{2,2})\"/g).join(',').replaceAll('"', '').split(',')
}

function compareMACs(jsonMACs) {
  let pc = getMACs()
  let res = false
  let i = 0
  while (!res && i <= pc.length) {
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
    title: 'Activación',
    minimizable: false,
    maximizable: false,
    resizable: false,
    icon: './goat-logo.ico',
    webPreferences: {
      devTools: false,
      preload: path.join(__dirname, '/views/activation/preload.js')
    }
  })

  win.menuBarVisible = false
  win.loadFile('./views/activation/activation.html')
  win.once('ready-to-show', () => {
    win.show()
  })

  ipcMain.handle('successfull-activation', (event, { email, pcName }) => {
    let macs = getMACs()
    if (!fs.existsSync(validationPath)) fs.mkdirSync(validationPath)
    fs.writeFileSync(validationFilePath, sign(`{"email":"${email}","deviceName":"${pcName}", "macs": ${JSON.stringify(macs)}}`, '7414564de855719cfd7a7d6782876f6a'))
    createMainWindow()
    win.close()
  })
}

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

app.whenReady().then(() => {
  if (!fs.existsSync(validationFilePath)) {
    createActivationWindow()
  } else {
    let validationData = verify(fs.readFileSync(validationFilePath).toString(), '7414564de855719cfd7a7d6782876f6a')
    if (validationData && validationData.deviceName == hostname() && compareMACs(validationData.macs)) {
      createMainWindow()
    } else {
      dialog.showErrorBox('Error!', 'No puede ejecutar el programa en este equípo. Por favor contactenos')
      app.quit()
    }
  }
})