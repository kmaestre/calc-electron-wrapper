const dispatchEventUpdateCurrencies = (payload) => {
  const obj = { detail: { data: payload || null } };

  window.dispatchEvent(new CustomEvent("update-currencies", obj));
};

window.updateCurrencies(dispatchEventUpdateCurrencies);
