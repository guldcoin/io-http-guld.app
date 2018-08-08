document.addEventListener('DOMContentLoaded', async function () {
  await loadHTMLComponent('/transaction-submit.html', 'section-transaction-submit')
})


async function validateSender () {
  var senderDiv = document.getElementById('guld-transaction-sender')
  if (senderDiv.value === "") return true
  var errmess = 'Unknown sender. '
  var found = await getPerspective(senderDiv.value)
  if (found) {
    errorDisplay.unsetError(errmess)
  } else {
    errorDisplay.setError(errmess)
  }
  return found
}

async function validateRecipient () {
  var recDiv = document.getElementById('guld-transaction-recipient')
  if (recDiv.value === "") return true
  var errmess = 'Unknown recipient. '
  var found = await getPerspective(recDiv.value)
  if (found) {
    errorDisplay.unsetError(errmess)
  } else {
    errorDisplay.setError(errmess)
  }
  return found
}

async function validateSpendAmount () {
  var errmess = 'Invalid amount. '
  var amtDiv = document.getElementById('guld-spend-amount')
  var sender = document.getElementById('guld-transaction-sender').value || perspective
  try {
    var amount = new Decimal(amtDiv.value)
  } catch (e) {
    return false
  }
  var bal = new Decimal(0)
  window.balances_cache = window.balances_cache || {}
  balances_cache = await getBalances(sender, commodity)
  if (balances_cache[sender] && balances_cache[sender][`${sender}:Assets`] && balances_cache[sender][`${sender}:Assets`][commodity]) bal = balances_cache[sender][`${sender}:Assets`][commodity].value
  if (amount.greaterThan(bal)) {
    errorDisplay.setError(errmess)
    return false
  } else {
    errorDisplay.unsetError(errmess)
    return true
  }
}

async function validateSubmitTransaction () {
  var errmess = 'Invalid transaction submitted. '
  var sigDiv = document.getElementById('signed-transaction')
  var sender = document.getElementById('guld-transaction-sender').value || perspective
  return getPGPKey(sender).then(async (pubkey) => {
    var verified = await keyringPGP.verify(sigDiv.value, undefined, observer.user.signingkey)
    if (!verified) {
      errorDisplay.setError(errmess)
      return false
    } else {
      var msg = openpgp.cleartext.readArmored(sigDiv.value).text
      var amount = ledgerTypes.Transaction.getAmount(msg)
      var time = ledgerTypes.Transaction.getTimestamp(msg)
      var res = `[ ]*${sender}:Assets[ ]*${amount} ${commodity}`
      var re = new RegExp(res)
      if (!msg.match(re) || amount >= 0 || balances_cache[perspective][`${sender}:Assets`][commodity].value.toNumber() + amount < 0) {
        errorDisplay.setError(errmess)
      } else {
        var response = await fetch(`ledger/${commodity}/${sender}/${time}.asc`)
        if (response.ok) errorDisplay.setError(errmess)
        else {
          var response = await fetch('pushtx/transfer', {
            method: 'POST',
            headers: {
              'content-type': 'application/json'
            },
            body: JSON.stringify({'transfer': sigDiv.value})
          })
          if (response.ok) {
            var txhash = await response.text()
            $('#submit-success-modal').modal('show')
            document.getElementById('submit-success-message').innerHTML = `Transaction submitted. Hash: ${txhash}`
            errorDisplay.unsetError(errmess)
            return true
          } else {
            errorDisplay.setError(errmess)
            return false
          }
        }
      }
    }
  }).catch(e => {
    console.error(e)
    errorDisplay.setError(errmess)
    return false
  })
  
}

function showRawTransaction (ttype) {
  var section = document.getElementById('section-transaction-submit')
  if (section.className.indexOf('d-none') > -1) section.className = section.className.replace(/d-none/g, '')
  if (ttype === 'transfer') {
    var sender = document.getElementById('guld-transaction-sender').value
    var recipient = document.getElementById('guld-transaction-recipient').value
    var amount = document.getElementById('guld-spend-amount').value
    var transfer = LedgerTransfer.create(sender, recipient, amount, commodity)
    var rawtx = document.getElementById('raw-transaction')
    rawtx.value = transfer.raw
    var link = document.getElementById('download-transaction-link')
    link.href = `data:text/plain;charset=utf-8,${encodeURIComponent(transfer.raw)}`
    link.download = `${ledgerTypes.Transaction.getTimestamp(transfer.raw)}`
  }
  return false
}

