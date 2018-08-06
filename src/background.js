/* global chrome:false */

const { apiMessageHandler } = require('./api.js')
const AppObserver = require('./observer.js')
const observer = window.observer = new AppObserver()

async function init() {
  chrome.browserAction.disable()
  chrome.browserAction.setBadgeText({text: 'wait'})
  chrome.browserAction.setTitle({title: 'Loading blocktree snapshot, this may take up to ten minutes.'})
  var now = new Date()
  var start = now.getTime()
  observer.log(`starting blocktree init @ ${now.toLocaleString()}`)
  await observer.init()
  observer.log(`${(Date.now() - start) / 60000} minutes to init blocktree and ledger`)
  chrome.browserAction.enable()
  chrome.browserAction.setBadgeText({text: ''})
  chrome.browserAction.setTitle({title: 'Guld wallet and key manager.'})
}

// initialize the blocktree on first install
chrome.runtime.onInstalled.addListener(e => {
  setTimeout(init, 1000)
})

// set uninitialized on uninstall, and clear localstorage... redundant?
chrome.management.onUninstalled.addListener(strid => {
  if (strid === chrome.runtime.id) {
    observer.db.clear()
  }
})

// Open app in tab when user clicks on the icon
chrome.browserAction.onClicked.addListener(function (tab) {
  chrome.tabs.create({
    'url': chrome.extension.getURL('src/index.html')
  }, function (tab) {})
})

// API for other apps
chrome.runtime.onConnectExternal.addListener(function (port) {
  if (knownApps.indexOf(port.sender.id) !== -1) port.onMessage.addListener(apiMessageHandler)
})

