const dispatchEventUpdateCurrencies = (payload) => {
    if (!payload) return
    window.dispatchEvent(new CustomEvent('update-currencies', { detail: { data: payload } }))
}

window.updateCurrencies(dispatchEventUpdateCurrencies)