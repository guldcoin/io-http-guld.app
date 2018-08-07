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
  try {
    var amount = new Decimal(amtDiv.value)
  } catch (e) {
    return false
  }
  var bal = balances_cache[perspective][`${perspective}:Assets`][commodity].value
  if (amount.greaterThan(bal)) {
    errorDisplay.setError(errmess)
    return false
  } else {
    errorDisplay.unsetError(errmess)
    return true
  }
}

async function showRawTransaction () {
}
