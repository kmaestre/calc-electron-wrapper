const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");
const finance = require("yahoo-finance2").default;
const { sign, verify } = require("jsonwebtoken");

const os = require("os");
const validationPath = path.join(os.homedir(), "./goataca/");
const validationFilePath = path.join(validationPath, "application.json");

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
    let res = await finance.quote(["PEN=X", "EUR=X", "PENUSD=X", "PENEUR=X"]);
    let currencyObj = {};

    res.forEach(({ regularMarketPrice, symbol }) => {
      if (symbol == "PEN=X") currencyObj.USDPEN = { value: regularMarketPrice, symbol };
      if (symbol == "EUR=X") currencyObj.USDEUR = { value: regularMarketPrice, symbol };
      if (symbol == "PENUSD=X") currencyObj.PENUSD = { value: regularMarketPrice, symbol };
      if (symbol == "PENEUR=X") currencyObj.PENEUR = { value: regularMarketPrice, symbol };
    });

    win.webContents.postMessage("update-currencies", currencyObj);
  } catch (err) {
    dialog.showErrorBox("Error!", "Ocurrio un error al intentar actualizar los valores de las monedas");
    win.webContents.postMessage("update-currencies");
  }
}

function createActivationWindow() {
  const win = new BrowserWindow({
    width: 300,
    height: 150,
    show: false,
    title: "Activación",
    minimizable: false,
    maximizable: false,
    resizable: false,
    icon: "./goat-logo.ico",
    webPreferences: {
      devTools: false,
      preload: path.join(__dirname, "/views/activation/preload.js"),
    },
  });

  win.menuBarVisible = false;
  win.loadFile("./views/activation/activation.html");
  win.once("ready-to-show", () => {
    win.show();
  });

  ipcMain.handle("successfull-activation", (event, data) => {
    if (!fs.existsSync(validationPath)) fs.mkdirSync(validationPath);

    fs.writeFileSync(validationFilePath, sign(JSON.stringify(data), "7414564de855719cfd7a7d6782876f6a"));
    createMainWindow();
    win.close();
  });
}

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

app.whenReady().then(() => {
  if (!fs.existsSync(validationFilePath)) {
    createActivationWindow();
  } else {
    const { uuid, pcName } = verify(
      fs.readFileSync(validationFilePath).toString(),
      "7414564de855719cfd7a7d6782876f6a"
    );

    if (uuid && pcName === os.hostname()) {
      createMainWindow();
    } else {
      dialog.showErrorBox("Error", "No puede ejecutar el programa en este equípo. Por favor contactenos");
      app.quit();
    }
  }
});
