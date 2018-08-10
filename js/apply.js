document.addEventListener('DOMContentLoaded', async function () {
  await loadHTMLComponent('/header.html', 'header-wrapper')
  await loadHTMLComponent('/footer.html', 'footer')
  await loadPerspective()
  window.commodity = qsLocalWindow.getValue('commodity', undefined, 'GULD')
  await changeCommodity(commodity)
  await redirectIfRegistered()
  await showTransactionTypes()
  showRawTransaction('register-individual')
  await setTitleTag()
  $('#signed-transaction').blur(validateApplication)
})

function showError (msg) {
  $('#apply-danger-modal').modal('show')
  $('#apply-danger-message').html(msg)
}

async function redirectIfRegistered() {
  if (perspective !== 'guld') {
    var memtype = getMemberType(perspective)
    if (memtype === 'individual' || memtype === 'group') {
      window.location = '/'
    } else if (window.observer && window.observer.user) {
      showError(`WARNING: This user already exists! Manual approval is required.`)
      if (window.observer.user.username) {
        document.getElementById('fullname').value = document.getElementById('guldname').value = window.observer.user.username
      }
      if (window.observer.user.name) {
        document.getElementById('fullname').value = window.observer.user.name
      }
      if (window.observer.user.email) {
        document.getElementById('guldmail').value = window.observer.user.email
      }
      if (window.observer.user.signingkey) {
        document.getElementById('guldfpr').value = window.observer.user.signingkey
      }
    }
  }
}

function validateName () {
  var gname = document.getElementById('guldname').value
  var re = /^[a-z0-9-]{4,40}$/
  var result = re.exec(gname)
  if (!result || result[0].length === 0) {
    return false
    showError(` Name is not valid. Can only be lowercase letters, numbers and dashes (-) `)
  } else {
    showRawTransaction('register-individual')
    return true
  }
}

function validateEmail() {
    var email = document.getElementById('guldmail').value
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    var valid = re.test(email)
    if (!valid) {
      showError(` Invalid email address. `)
      document.getElementById('guldmail-confirm').innerText = 'the email address above'
    } else {
      document.getElementById('guldmail-confirm').innerText = email
    }
    return valid
}

async function validatePGPKey() {
  var pubkey = document.getElementById('pubkey-import').value
  return keyringPGP.importPublicKey(pubkey).then(fpr => {
    document.getElementById('guldfpr').value = fpr
    return true
  }).catch(e => {
    showError(` Error importing PGP key `)
    return false
  })
}

async function validateApplication() {
  if (!validateName()) return false
  if (!validateEmail()) return false
  if (!validatePGPKey()) return false
  if (!validateRegistration()) return false
  updateEmail()
  return true
}

function updateEmail () {
  document.getElementById('rendered-subject').value = `${document.getElementById('guldname').value} application`
  document.getElementById('rendered-application').value = `[user]
        username = ${document.getElementById('guldname').value}
        name = ${document.getElementById('fullname').value}
        email = ${document.getElementById('guldmail').value}
        signingkey = ${document.getElementById('guldfpr').value}

${document.getElementById('signed-transaction').value}

${document.getElementById('pubkey-import').value}
`
  document.getElementById('email-application').href = `mailto:info@guld.io?subject=${encodeURIComponent(document.getElementById('rendered-subject').value)}&body=${encodeURIComponent(document.getElementById('rendered-application').value)}`
  document.getElementById('download-application-link').href = `data:text/plain;charset=utf-8,${encodeURI(document.getElementById('rendered-application').value)}`
}

async function validateRegistration () {
  var errmess = 'Invalid transaction submitted. '
  var sigDiv = document.getElementById('signed-transaction')
  sigDiv.value = sigDiv.value.replace('—', '--')
  if (!sigDiv.value.startsWith('-----')) {
    showError(errmess)
    return false
  }
  var gname = document.getElementById('guldname').value || perspective
  var verified = await keyringPGP.verify(sigDiv.value, undefined, document.getElementById('guldfpr').value)
  if (!verified) {
    showError(errmess)
    return false
  } else {
    var msg = openpgp.cleartext.readArmored(sigDiv.value).text
    var amount = ledgerTypes.Transaction.getAmount(msg)
    var time = ledgerTypes.Transaction.getTimestamp(msg)
    var registration = LedgerRegister.create(gname, 'individual', 1, 'GULD', null, time)
    if (registration.raw.replace(/\r\n/gm, '\n').trim() !== msg.replace(/\r\n/gm, '\n').trim()) {
      showError(errmess)
      return false
    } else {
      $('#email-application').disabled = false
      return true
    }
  }  
}

