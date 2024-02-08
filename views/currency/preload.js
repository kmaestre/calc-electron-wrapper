const { ipcRenderer } = require("electron");

const getRate = () => {
  const attrName = "data-exchange-rate";

  const rate = Number(
    document.querySelector(`[${attrName}]`)?.getAttribute(attrName)
  );

  return rate;
};

setTimeout(() => {
  ipcRenderer.send("set-rate", getRate());
}, 1000);
