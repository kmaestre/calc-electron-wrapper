const { app, BrowserWindow, dialog } = require("electron");
const path = require("path");
const finance = require("yahoo-finance2").default;

function createMainWindow() {
  const win = new BrowserWindow({
    width: 700,
    minWidth: 700,
    maxWidth: 700,
    title: "Calculadora",
    maximizable: true,
    resizable: true,
    show: false,
    useContentSize: true,
    icon: "./goat-logo.ico",
    webPreferences: {
      devTools: false,
      preload: path.join(__dirname, "/views/main/preload.js"),
    },
  });
  win.setAspectRatio(4 / 3);
  win.menuBarVisible = false;
  win.loadFile(path.join(__dirname, "/views/main/index.html"));
  win.once("ready-to-show", async () => {
    win.show();
    try {
      await fetchCurrencyData(win);
    } finally {
      setInterval(() => fetchCurrencyData(win), 60000);
    }
  });
}

async function fetchCurrencyData(win) {
  try {
    const symbols = ["PEN=X", "EUR=X", "PENUSD=X", "PENEUR=X"];
    //let res = await finance.quoteSummary(["PEN=X", "EUR=X", "PENUSD=X", "PENEUR=X"]);
    let res = await Promise.all(symbols.map((s) => finance.quoteSummary(s)));

    let currencyObj = {};

    res.forEach(({ price }) => {
      const { regularMarketPrice, symbol } = price;
      if (symbol == "PEN=X") currencyObj.USDPEN = { value: regularMarketPrice, symbol };
      if (symbol == "EUR=X") currencyObj.USDEUR = { value: regularMarketPrice, symbol };
      if (symbol == "PENUSD=X") currencyObj.PENUSD = { value: regularMarketPrice, symbol };
      if (symbol == "PENEUR=X") currencyObj.PENEUR = { value: regularMarketPrice, symbol };
    });

    win.webContents.postMessage("update-currencies", currencyObj);
  } catch (err) {
    dialog.showErrorBox("Ocurrio un error al intentar actualizar los valores de las monedas");
    win.webContents.postMessage("update-currencies");
  }
}

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

app.whenReady().then(() => {
  createMainWindow();
});
