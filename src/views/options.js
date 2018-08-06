async function loadOptions () {
  this.observer.setDisplay('login')
  document.getElementById('loading-div').style.display = 'none'
  guldnameDiv = document.getElementById('guldname-new')
  guldmailDiv = document.getElementById('guldmail')
  errdiv = document.getElementById('err-div')
  if (guldnameDiv) { guldnameDiv.addEventListener('focusout', this.observer.checkGName) }
  passin = document.getElementById('key-passphrase')
  passrin = document.getElementById('key-passphrase-repeat')
  emodel = document.getElementById('expert-mode')
  document.getElementById('logout').addEventListener('click', this.observer.logout)
  var ghavatarDiv = document.getElementById('ghavatar')
  if (ghavatarDiv) {
    ghavatarDiv.addEventListener('click', e => {
      this.observer.hosts.github.auth = {}
      loadGithub()
    })
  }
  document.getElementById('key-create-radio-import').addEventListener('click', e => {
    setDisplay('import')
  })
  document.getElementById('key-create-radio-generate').addEventListener('click', e => {
    setDisplay('generate')
  })
  emodel.addEventListener('click', toggleExpertMode)
  document.getElementById('login-submit').addEventListener('click', submitLogin)
  document.getElementById('create-submit').addEventListener('click', submitCreate)
  document.getElementById('import-submit').addEventListener('click', submitImport)
  console.log('loading option details')
  await this.observer.loadGuldVals()
  await this.observer.hosts.github.loadGithub()
  if (this.observer.keyring.listKeys().length === 0) this.observer.setDisplay('generate')
  else if (this.observer.keyring.isLocked(this.observer.fpr) !== false) {
    document.getElementById('err-warn').innerHTML = 'Please unlock your key.'
    this.observer.setDisplay('login')    
  } else {
    this.observer.setDisplay('loggedin')
  }
}

async function submitLogin (e) {
  e.preventDefault()
  if (!this.observer.keyring.isLocked(this.observer.fpr)) {
    window.location = mainurl
  } else {
    await this.observer.keyring.unlock(this.observer.fpr, passin.value)
    window.location = mainurl
  }
}

async function submitCreate (e) {
  e.preventDefault()
  if (validatePass()) {
    var avail = await checkGName()
    if (avail || expertMode) {
      this.observer.name = guldnameDiv.value
      this.observer.fullname = document.getElementById('fullname-new').value
      if (this.observer.fullname.length === 0) this.observer.fullname = this.observer.name
      this.observer.mail = document.getElementById('guldmail').value
      var options = {
        numBits: 4096,
        userIds: [{
          name: this.observer.fullname,
          email: this.observer.mail
        }],
        passphrase: passin.value
      }
      var errmess = 'Generating keys, please wait. '
      setError(errmess)
      this.observer.fpr = await this.keyring.generate(options)
      this.keyring.unlock(this.observer.fpr, passin.value)
      unsetError(errmess)
      await b.setGuldID()
      await b.setupGHKey()
      await finishLocalSignup()
      window.location = mainurl
    }
  }
}

async function submitImport (e) {
  e.preventDefault()
  document.getElementById('loading-div').style.display = 'block'
  this.observer.fpr = await this.observer.keyring.importPrivateKey(document.getElementById('key-import').value).catch(setErrorNotLoading)
  await this.observer.keyring.unlock(passin.value)
//  await this.observer.keyring.importPublicKey(b.keyring.privateKeys.keys[0].toPublic().armor())
  this.observer.name = guldnameDiv.value
  if (b.keyring.privateKeys.keys[0].users.length > 0) {
    var userid = b.keyring.privateKeys.keys[0].users[0].userId.userid
    var uida = userid.replace('>', '').split('<')
    this.observer.fullname = uida[0].trim()
    this.observer.mail = uida[1].trim()
  }
  var names = await this.observer.keyring.mapNamesToFPR([this.observer.fpr])
  if (names.length === 1) this.observer.name = names[0]
  return finishLocalSignup()
}

async function finishLocalSignup () {
  await this.observer.hosts.github.setupGHKey()
  await this.observer.fs.renameBlocktree('guld', this.observer.name)
  await this.observer.hosts.github.forkGuld()
  await b.bootstrapBlocktree()
  await this.observer.hosts.github.setGH()
  await this.observer.db.setMany(this.observer)
  await this.observer.git.redirectAllRemotes()
  document.getElementById('loading-div').style.display = 'none'
  window.location = mainurl
}

async function toggleExpertMode () {
  if (emodel && emodel.checked) {
    expertMode = true
    document.getElementById('export-submit-private').style.display = 'block'
  } else {
    document.getElementById('export-submit-private').style.display = 'none'
    expertMode = false
  }
}
module.exports = loadOptions
