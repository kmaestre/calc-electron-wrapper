const { app, BrowserWindow, dialog } = require("electron");
const path = require("path");
const axios = require("axios");

async function createMainWindow() {
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

  win.once("ready-to-show", function () {
    this.show();
    fetchCurrencyData(this).finally(() => {
      setInterval(() => {
        fetchCurrencyData(this).catch((err) => {
          throw err;
        });
      }, 60000);
    });
  });
  await win.loadFile(path.join(__dirname, "/views/main/index.html"));
}

async function fetchCurrencyData(win) {
  try {
    const { rates: usdRates } = (
      await axios.get("https://api.exchangerate.host/latest", {
        params: {
          base: "USD",
          symbols: "PEN,EUR",
        },
      })
    ).data;

    const { rates: penRates } = (
      await axios.get("https://api.exchangerate.host/latest", {
        params: {
          base: "PEN",
          symbols: "USD,EUR",
        },
      })
    ).data;

    const currencyObj = {};
    currencyObj.USDPEN = { value: usdRates.PEN, symbol: "PEN=X" };
    currencyObj.USDEUR = { value: usdRates.EUR, symbol: "EUR=X" };
    currencyObj.PENUSD = { value: penRates.USD, symbol: "PENUSD=X" };
    currencyObj.PENEUR = { value: penRates.EUR, symbol: "PENEUR=X" };

    win.webContents.postMessage("update-currencies", currencyObj);
  } catch (err) {
    console.log(err);
    dialog.showErrorBox("Ocurrió un error al intentar actualizar los valores de las monedas", "");
    win.webContents.postMessage("update-currencies");
  }
}

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

app.on("ready", () => {
  createMainWindow();
});
