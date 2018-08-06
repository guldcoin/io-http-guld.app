async function load () {
  document.getElementById('loading-div').style.display = 'none'
  window.senderDiv = document.getElementById('guld-transaction-sender')
  window.recDiv = document.getElementById('guld-transaction-recipient')
  window.amtDiv = document.getElementById('guld-spend-amount')
  var formEl = document.getElementById('guld-transfer-form')
  window.senderDiv.value = b.guldname

  b.getBalance().then(bal => {
    if (bal && bal.Assets && bal.Assets.__bal && bal.Assets.__bal[commodity]) {
      amtDiv.max = bal.Assets.__bal[commodity].value.toString()
      window.balance = bal.Assets.__bal[commodity].value
    }
  })

  window.senderDiv.addEventListener('focusout', validateSender)
  window.recDiv.addEventListener('focusout', validateRecipient)
  window.amtDiv.addEventListener('change', validateSpendAmount)
  formEl.addEventListener('submit', e => {
    e.preventDefault()
    document.body.className = `${document.body.className} loading`
    if (validateSpendAmount()) {
      validateSender().then(valid => {
        if (valid) {
          validateRecipient().then(valid => {
            if (valid) {
              var time = Math.trunc(Date.now() / 1000)
              var tx = Transfer.create(window.senderDiv.value, window.recDiv.value, window.amtDiv.value, commodity, time)
              b.writeTx(tx, b.guldname, commodity, window.senderDiv.value, time).then(() => {
                window.location = `chrome-extension://${chrome.runtime.id}/src/index.html`
              }).catch(err => {
                document.body.className = document.body.className.replace(' loading', '')
                setError(err)
              })
            } else document.body.className = document.body.className.replace(' loading', '')
          })
        } else document.body.className = document.body.className.replace(' loading', '')
      })
    } else document.body.className = document.body.className.replace(' loading', '')
  })
}
