const curl = require('./curl.js')
const loadOptions = require('./views/options.js')
const loadRegister = require('./views/register.js')
const deposit = require('./views/deposit.js')
const dash = require('./views/dash.js')
const send = require('./views/send.js')
const grant = require('./views/grant.js')
const burn = require('./views/burn.js')
const convert = require('./views/convert.js')
const register = require('./views/register.js')
const cache = {}

const DIVS = {
  'login': {
    'key-create-radio-div': false,
    'guldfpr-div': true,
    'key-import-div': false,
    'guldname-div': true,
    'fullname-div': false,
    'guldmail-div': false,
    'key-passphrase-div': true,
    'key-passphrase-repeat-div': false,
    'expert-mode-div': false,
    'unlock-submit-div': true,
    'import-submit-div': false,
    'export-submit-div': false,
    'create-submit-div': false,
    'err-warn': 'Please unlock your key.'
  },
  'import': {
    'key-create-radio-div': true,
    'guldfpr-div': false,
    'key-import-div': true,
    'guldname-div': true,
    'fullname-div': false,
    'guldmail-div': false,
    'key-passphrase-div': true,
    'key-passphrase-repeat-div': false,
    'expert-mode-div': true,
    'unlock-submit-div': false,
    'import-submit-div': true,
    'export-submit-div': false,
    'create-submit-div': false,
    'err-warn': ''
  },
  'loggedin': {
    'key-create-radio-div': false,
    'guldfpr-div': true,
    'key-import-div': false,
    'guldname-div': true,
    'fullname-div': false,
    'guldmail-div': false,
    'key-passphrase-div': false,
    'key-passphrase-repeat-div': false,
    'expert-mode-div': true,
    'unlock-submit-div': false,
    'import-submit-div': false,
    'export-submit-div': true,
    'create-submit-div': false,
    'err-warn': ''
  },
  'generate': {
    'key-create-radio-div': true,
    'guldfpr-div': false,
    'key-import-div': false,
    'guldname-div': true,
    'fullname-div': true,
    'guldmail-div': true,
    'key-passphrase-div': true,
    'key-passphrase-repeat-div': true,
    'expert-mode-div': true,
    'unlock-submit-div': false,
    'import-submit-div': false,
    'export-submit-div': false,
    'create-submit-div': true,
    'err-warn': 'WARNING: Everything except your passphrase is public!'
  }
}

async function setupPage () {
  var page = detectPage()
  console.log(page)
  if (page !== 'options' && (!this.observer.name || this.observer.name === 'guld' || this.hosts.github === undefined || !this.hosts.github.name)) {
    console.log('new locale')
    window.location = `chrome-extension://${chrome.runtime.id}/src/index.html?view=options`
  }
  detectCommodity()
  await loadHTML('currency-tab')
  document.body.id = self.commodity.toLowerCase()
  var el = document.getElementById(`${self.commodity.toLowerCase()}-tab`)
  if (el) el.setAttribute('class', 'active')
  await this.observer.loadHTML('header-wrapper')
  await this.observer.showPage(page)
  if (this.observer.initialized) await this.observer.showBalances()
  else this.observer.on('initialized', this.observer.showBalances)
  await this.observer.showTransactionTypes()
}

function getCachedDiv (div) {
  if (!cache.hasOwnProperty(div)) cache[div] = document.getElementById(div)
  return cache[div]
}

function showTransactionTypes (page, comm) {
  page = page || detectPage()
  comm = comm || detectCommodity()
  ttypes = {
    'GULD': ['send', 'register', 'grant'],
    'GG': ['send', 'burn'],
    'BTC': ['deposit', 'convert']
  }
  if (ttypes[comm]) {
    ttypes[comm].forEach(ttype => {
      document.getElementById(ttype).style.display = 'inline-block'
    })
  }
}

function parseQS () {
  var args = {}
  window.location.search.replace('?', '').split('&').forEach(v => {
    var val = v.split('=')
    args[val[0]] = val[1]
  })
  return args
}

function detectPage (qs) {
  qs = qs || parseQS()
  window.currentPage = qs.view || 'dash'
  return window.currentPage
}

function detectCommodity (qs) {
  qs = qs || parseQS()
  self.commodity = qs.commodity || 'GULD'
  return self.commodity
}

async function showPage (page) {
  page = page || detectPage()
  if (page !== 'options') {
    var logout = document.getElementById('logout')
    logout.addEventListener('click', logout)
    logout.style.display = 'block'
    document.getElementById('balance-div').style.display = 'block'
    document.getElementById('header-menu').style.display = 'block'
    document.getElementById('currency-tab').style.display = 'block'
    document.getElementById('settings').style.display = 'block'
  }

  await loadHTML(page, 'content')
  var el = document.getElementById(page)
  if (el) el.setAttribute('class', 'active')
  var hnav = document.getElementById('header-nav')
  for (var i = 0; i < hnav.children.length; i++) {
    hnav.children[i].href = hnav.children[i].href.replace(/(GULD|BTC|GG)/, self.commodity)
  }
}

async function loadHTML (component, eid) {
  eid = eid || component
  if (['currency-tab', 'header-wrapper'].indexOf(component) >= 0) {
    document.getElementById(eid).innerHTML = await curl(`/src/components/${component}.html`)
  } else {
    document.getElementById(eid).innerHTML = await curl(`/src/views/${component}.html`)
  }
}

function setDisplay (t) {
  tab = t
  Object.keys(DIVS[tab]).forEach(div => {
    var el = document.getElementById(div)
    if (el) {
      if (DIVS[tab][div]) el.style.display = 'block'
      else if (DIVS[tab][div] === false) el.style.display = 'none'
      else if (div === 'err-warn') el.innerHTML = DIVS[tab][div]
    }
  })
}

module.exports = {
  setDisplay: setDisplay,
  loadHTML: loadHTML,
  showPage: showPage,
  setupPage: setupPage,
  getCachedDiv: getCachedDiv,
  showTransactionTypes: showTransactionTypes,
  parseQS: parseQS,
  detectPage: detectPage,
  detectCommodity: detectCommodity,
  loadOptions: loadOptions
}
