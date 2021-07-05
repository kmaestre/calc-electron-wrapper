const dispatchEventUpdateCurrencies = (payload) => {
    window.dispatchEvent(new CustomEvent('update-currencies', { detail: { data: payload } }))
}

window.updateCurrencies(dispatchEventUpdateCurrencies)