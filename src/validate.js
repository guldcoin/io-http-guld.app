const NAMEWARN = 'Guld name is not available or valid, choose another.'

async function validatePass () {
  var errmess = 'Password invalid or does not match. '
  // TODO get these elements
  var same = (passin.value === passrin.value)
  if (same !== true) this.observer.setError(errmess)
  else this.observer.unsetError(errmess)
  return same
}

async function validateSender () {
  window.senderDiv = window.senderDiv || document.getElementById('guld-transaction-sender')
  var errmess = 'Unknown sender. '
  var avail = await this.observer.isGuldNameAvail(window.senderDiv.value)
  if (avail !== false) {
    this.observer.setError(errmess)
  } else {
    this.observer.unsetError(errmess)
  }
  return (avail === false)
}

async function validateRecipient () {
  window.recDiv = window.recDiv || document.getElementById('guld-transaction-recipient')
  var errmess = 'Unknown recipient. '
  var avail = this.observer.isGuldNameAvail(window.recDiv.value)
  if (avail !== false) {
    this.observer.setError(errmes)
  } else {
    this.observer.unsetError(errmess)
  }
  return (avail === false)
}

async function validateSpendAmount () {
  amtDiv = amtDiv || document.getElementById('guld-spend-amount')
  amount = new Decimal(amtDiv.value)
  var errmess = 'Invalid amount. '
  if (amount.greaterThan(window.balance.toString())) {
    this.observer.setError(errmess)
    return false
  } else {
    this.observer.unsetError(errmess)
    return true
  }
}

async function checkGName () {
  console.log(this.observer)
  var avail = this.observer.isGuldNameAvail(guldnameDiv.value)
  if (avail && errdiv.innerHTML.indexOf(NAMEWARN) > -1) this.observer.unsetError(NAMEWARN)
  else if (errdiv.innerHTML.indexOf(NAMEWARN) === -1) this.observer.setError(NAMEWARN)
  return avail
}

module.exports = {
  checkGName: checkGName,
  validateSpendAmount: validateSpendAmount,
  validateRecipient: validateRecipient,
  validateSender: validateSender,
  validatePass: validatePass
}
