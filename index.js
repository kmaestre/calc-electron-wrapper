const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

async function createMainWindow() {
  const win = new BrowserWindow({
    title: "Calculadora G.O.A.T",
    maximizable: false,
    resizable: false,
    show: false,
    useContentSize: true,
    icon: "./goat-logo.ico",
    webPreferences: {
      devTools: false,
      preload: path.join(__dirname, "/views/main/preload.js"),
    },
  });
  win.menuBarVisible = false;

  win.on("page-title-updated", (e) => e.preventDefault());

  win.once("ready-to-show", function () {
    this.show();
  });

  await win.loadFile(path.join(__dirname, "/views/main/index.html"));

  return win;
}

async function currencyWindow(symbol, url) {
  const win = new BrowserWindow({
    show: false,
    title: symbol,
    resizable: true,
    icon: "./goat-logo.ico",
    webPreferences: {
      devTools: false,
      preload: path.join(__dirname, "/views/currency/preload.js"),
    },
  });
  win.menuBarVisible = false;

  win.on("page-title-updated", (e) => e.preventDefault());

  await win.loadURL(url);
}

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

app.on("ready", async function () {
  const mainWindow = await createMainWindow();

  const currencyObj = {};

  ipcMain.on("set-rate", ({ sender }, value) => {
    if (!value) return sender.close();

    const senderWindow = BrowserWindow.fromWebContents(sender);

    //TODO: set symbols correctly
    currencyObj[senderWindow.title] = { symbol: "PENUSD=X", value };
    senderWindow.close();

    mainWindow.webContents.postMessage("update-currencies", currencyObj);
  });

  getCurrencyRates();

  setInterval(getCurrencyRates, 60000);
});

const getCurrencyRates = () => {
  currencyWindow("PENUSD", "https://www.google.com/search?q=pen+to+usd");
  currencyWindow("PENEUR", "https://www.google.com/search?q=pen+to+eur");
  currencyWindow("USDPEN", "https://www.google.com/search?q=usd+to+pen");
  currencyWindow("USDEUR", "https://www.google.com/search?q=usd+to+eur");
};
