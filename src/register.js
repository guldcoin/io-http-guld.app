
async function loadRegister () {
  var regTypeDiv = document.getElementById('guld-registration-type')
  var nameDiv = document.getElementById('guld-registration-name')
  amtDiv = document.getElementById('guld-spend-amount')
  var formEl = document.getElementById('registration-form')

  b.getBalance().then(bal => {
    if (bal && bal.Assets && bal.Assets.__bal && bal.Assets.__bal[commodity]) {
      amtDiv.max = bal.Assets.__bal[commodity].value.toString()
      window.balance = bal.Assets.__bal[commodity].value
    }
  })

  b.isRegistered(b.guldname).then(registered => {
    if (registered) regTypeDiv.value = 'group'
    else {
      regTypeDiv.value = 'individual'
      b.blocktree.getPrice('GULD', '$').then(price => {
        setError(`Everyone has to register on the guld group before being able to send or contract. The cost is currently 0.1 GULD or ~$${price.value.mul(0.1)}. Please click 'register' to continue.`)
        amtDiv.value = 0.1
        amtDiv.disabled = true
        nameDiv.value = b.guldname
        nameDiv.disabled = true
      })
    }
  })

  formEl.addEventListener('submit', e => {
    e.preventDefault()
    if (validateSpendAmount()) {
      validateSender().then(valid => {
        if (valid) {
          validateRecipient().then(valid => {
            if (valid) {
              var time = Math.trunc(Date.now() / 1000)
              var tx = Register.create(nameDiv.value, regTypeDiv.value, (new Decimal(10)).mul(amtDiv.value).toNumber(), commodity, b.guldname, time)
            }
          })
        }
      })
    }
  })
}

module.exorts = loadRegister
