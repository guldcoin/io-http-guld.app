window.ATYPES = new Array('Assets', 'Liabilities', 'Equity', 'Expenses', 'Income')
window.keyring = new openpgp.Keyring()

document.addEventListener('DOMContentLoaded', async function () {
  await loadHTMLComponent('/header.html', 'header-wrapper')
  await loadHTMLComponent('/footer.html', 'footer')
  await loadPerspective()
  window.commodity = qsLocalWindow.getValue('commodity', undefined, 'GULD')
  await changeCommodity(commodity)
  await showTransactionTypes()
  await setTitleTag()
  await showMobileTooltip()
})

async function getPerspective (pers) {
  pers = pers || qsLocalWindow.getValue('perspective', undefined, 'guld')
  return fetch(`dotfiles/${pers}/.gitconfig`).then(async response => {
    if (response.ok) {
      var cfgtxt = await response.text()
      return gitConfigIni.decode(cfgtxt)
    }
  }).catch(e => undefined)
}

async function loadPerspective (pers) {
  var msg = `Could not find perspective`
  var persp = await getPerspective(pers)
  if (persp) {
    try {
      errorDisplay.unsetError(msg)
    } catch (e) {
    }
    window.observer = persp
    await loadGuldVals()
    await showBalances()
    if (typeof(showMemberDetails) !== 'undefined') await showMemberDetails()
  } else {
    try {
      errorDisplay.setError(msg)
    } catch (e) {
      console.error(e)
      if (typeof(showError) !== undefined) showError(msg)
    }
  }
}

async function loadGuldVals () {
  var gnameDiv = document.getElementById('guldname')
  if (gnameDiv) gnameDiv.innerHTML = observer.user.username
  return observer
}

async function getEquityCache () {
  if (!window.hasOwnProperty('equity_cache')) {
    var response = await fetch(`ledger/equity.cache`)
    if (response.ok) {
      window.equity_cache = await response.text()
      return equity_cache
    } else {
      throw new Error(`Could not reach the API`)
    }
  }
  return equity_cache
}

async function getBalances () {
  window.equity_cache = await getEquityCache()
  window.balances = ledgerTypes.Account.createFromEquity(equity_cache)
  return balances
}

async function showBalances (gname, comm="GULD") {
  gname = gname || observer.user.username
  window.balances = await getBalances()
  var balDiv = document.getElementById('balance')
  if (balances.hasOwnProperty(gname) && balances[gname].hasOwnProperty(`Assets`)) {
    var acs = document.getElementsByClassName('ledger-amount')
    for (var a in acs) {
      if (acs[a].innerText) {
        var c = acs[a].commodity || acs[a].innerText.split(' ').slice(-1)
        var bal = balances[observer.user.username][`Assets`].__bal[c]
        if (bal) {
          acs[a].innerText = `${bal.value.toNumber().toLocaleString()}`
          acs[a].commodity = c
          if (acs[a].id === "balance" || (acs[a].className && acs[a].className.indexOf('dropdown-item') > -1)) acs[a].innerText = `${acs[a].innerText} ${c}`
        }
      }
    }
  } else {
    balDiv.innerHTML = `0`
  }
  if (typeof(showBalanceDetails) !== 'undefined') await showBalanceDetails(gname)
}

async function getUSDValue (assets, comm) {
  try {
    var price = await getCommodityPrice(comm, 'USD')
  } catch (e) {
    return 0
  }
  var val = new Decimal(0)
  if (price && assets && price.value && assets.value) val = price.value.mul(assets.value).mul(new Decimal(100)).round(2).div(new Decimal(100))
  return val
}

async function getBalanceMatrix (gname) {
  var matrix = {}
  for (var typ in ATYPES) {
    var t = ATYPES[typ]
    if (balances[gname].hasOwnProperty(t)) {
      await Promise.all(balances[gname][t].__bal.commodities().map(async c => {
        var assets = balances[gname][t].__bal[c]
        var val = await getUSDValue(assets, c)
        matrix[c] = matrix[c] || {}
        matrix[c][t] = matrix[c][t] || {}
        matrix[c][t].value = val
        matrix[c][t].balance = assets
      }))
    }
    if (t === 'Equity') {
      if (balances['gg'][t][gname] && gname !== 'gg') {
        var assets = balances['gg'][t][gname].__bal['GG']
        var val = await getUSDValue(assets, 'GG')
        matrix['GG'] = matrix['GG'] || {}
        matrix['GG'][t] = matrix['GG'][t] || {}
        matrix['GG'][t].value = val
        matrix['GG'][t].balance = assets
      }
      if (balances['guld'][t][gname] && gname !== 'guld') {
        var assets = balances['guld'][t][gname].__bal['GULD']
        var val = await getUSDValue(assets, 'GULD')
        matrix['GULD'] = matrix['GULD'] || {}
        matrix['GULD'][t] = matrix['GULD'][t] || {}
        matrix['GULD'][t].value = val
        matrix['GULD'][t].balance = assets
      }
      if (balances['isysd'][t][gname] && gname !== 'isysd') {
        var assets = balances['isysd'][t][gname].__bal['ISYSD']
        var val = await getUSDValue(assets, 'ISYSD')
        matrix['ISYSD'] = matrix['ISYSD'] || {}
        matrix['ISYSD'][t] = matrix['ISYSD'][t] || {}
        matrix['ISYSD'][t].value = val
        matrix['ISYSD'][t].balance = assets
      }
    }
  }
  return matrix
}

async function getPGPKey (gname, fpr) {
  gname = gname || observer.user.username
  fpr = fpr || observer.user.signingkey
  return keyringPGP.getPublicKey(fpr).then(pubkey => pubkey).catch(async e => {
    var response = await fetch(`keys/pgp/${gname}/${fpr}.asc`)
    if (response.ok) {
      pubkey = await response.text()
      await keyringPGP.importPublicKey(pubkey)
      return pubkey
    } else {
      throw new Error(`Could not reach the API`)
    }
  })
}

async function changePerspective (per) {
  delete window.perspective
  per = per.toLowerCase()
  window.perspective = qsLocalWindow.getValue('perspective', `?perspective=${per}`, per)
  await loadPerspective(per)
  await setTitleTag()
  $('#login-dropdown-toggle').dropdown("toggle")
}

async function changeCommodity (comm) {
  delete window.commodity
  comm = comm.toUpperCase()
  window.commodity = qsLocalWindow.getValue('commodity', `?commodity=${comm}`, comm)
  var acs = document.getElementsByClassName('active-commodity')
  for (var a in acs) {
    if (balances[observer.user.username].hasOwnProperty(`Assets`) && balances[observer.user.username][`Assets`].__bal.hasOwnProperty(commodity)) {
      var bal = balances[observer.user.username][`Assets`].__bal[commodity].value.toNumber().toLocaleString()
      if (bal) acs[a].textContent = `${bal} ${commodity}`
      else acs[a].textContent = `0 ${commodity}`
    } else acs[a].textContent = `0 ${commodity}`
    acs[a].commodity = commodity
  }
  await showBalances(perspective, commodity)
  await showTransactionTypes()
  await setTitleTag()
  return false
}

async function getCommodityPrice (base='GULD', quote='USD') {
  base = base.toUpperCase()
  if (!window.hasOwnProperty('prices') || !window.prices.hasOwnProperty(quote) || !window.prices[quote].hasOwnProperty(base)) {
    var exchange = 'guld-core'
    if (['GULD', 'ISYSD', 'GG', 'XCM'].indexOf(base) === -1) exchange = 'coinmarketcap'
      await fetch(`market/${quote}/${base}/prices/${exchange}.dat`).then(async function (response) {
      if (response.ok) {
        window.prices = window.prices || {}
        window.prices[quote] = window.prices[quote] || {}
        var ledger = await response.text()
        var price = ledgerTypes.commodity.parseCommodityPrice(ledger, base, quote)
        window.prices[quote][base] = price
      } else {
        if (base !== 'GULD' && quote === 'USD') {
          var guldPrice = await getCommodityPrice(base, 'GULD')
          var guldUSDPrice = await getCommodityPrice('GULD', 'USD')
          window.prices[quote][base] = guldUSDPrice.div(new ledgerTypes.Amount(guldPrice.value, quote))
        }
      }
    }).catch(async e => {
      if (base !== 'GULD' && quote === 'USD') {
        var guldPrice = await getCommodityPrice(base, 'GULD')
        var guldUSDPrice = await getCommodityPrice('GULD', 'USD')
        window.prices[quote][base] = guldUSDPrice.div(new ledgerTypes.Amount(guldPrice.value, quote))
      } else throw e
    })
  }
  return window.prices[quote][base]
}

function showTransactionTypes () {
  window.commodity = qsLocalWindow.getValue('commodity', undefined, 'GULD')
  var alltypes = [
    'send',
    'register',
    'grant',
    'burn',
    'deposit',
    'convert'
  ]

  ttypes = {
    'GG': ['send'],
    'ISYSD': ['send'],
//    'BTC': ['deposit', 'convert'],
    'GULD': ['send'] // , 'register', 'grant', 'burn'
  }
  alltypes.forEach(ttype => {
    if (ttypes[commodity] && ttypes[commodity].indexOf(ttype) >= 0) {
      document.getElementById(`${ttype}-nav`).style.display = 'inline-block'
    } else {
      document.getElementById(`${ttype}-nav`).style.display = 'none'
    }
  })
}

async function validatePass () {
  var errmess = 'Password invalid or does not match. '
  // TODO get these elements
  var same = (passin.value === passrin.value)
  if (same !== true) errorDisplay.setError(errmess)
  else errorDisplay.unsetError(errmess)
  return same
}

async function setTitleTag () {
  var bal = 0
  if (balances[perspective] && balances[perspective]['Assets'] && balances[perspective]['Assets'].__bal[commodity]) bal = balances[perspective]['Assets'].__bal[commodity].value.toNumber().toLocaleString()
  document.title = `${perspective} ${bal} ${commodity}`
}

function getMemberType(member) {
  if (balances.guld.Income.register.individual.hasOwnProperty(member)) return 'individual'
  else if (balances.guld.Income.register.group.hasOwnProperty(member)) return 'group'
  else if (balances.guld.Income.register.device && balances.guld.Income.register.device.hasOwnProperty(member)) return 'device'
}
 
async function showMemberStatus() {
  if (perspective === 'guld') {
      errorDisplay.setError(`You are viewing the guld group account, not your own. 
<a onClick="">View as another member</a> or <a href="apply.html">Apply for a name</a>.`)
  } else {
    var memtype = getMemberType(perspective)
    if (memtype === 'individual') {
    } else if (memtype === 'group') {
    } else {
      errorDisplay.setError(`WARNING: "${perspective}" is not registered!<br><br>This is probably a new or unclaimed account. 
<a onClick="">View as another member</a> or <a href="apply.html">apply for the name ${perspective}</a>.`)
    }
  }
}

async function showMobileTooltip() {
    var targets = $('[rel~=tooltip]'),
      target = false,
      tooltip = false,
      title = false
    targets.bind('mouseenter', function() {
      target = $(this)
      tip = target.attr('title')
      tooltip = $('<div id="tooltip"></div>')
      if (!tip || tip == '')
        return false
      target.removeAttr('title')
      tooltip.css('opacity', 0)
        .html(tip)
        .appendTo('body')
      var init_tooltip = function() {
        if ($(window).width() < tooltip.outerWidth() * 1.5)
          tooltip.css('max-width', $(window).width() / 2)
        else
          tooltip.css('max-width', 340)
        var pos_left = target.offset().left + (target.outerWidth() / 2) - (tooltip.outerWidth() / 2),
          pos_top = target.offset().top - tooltip.outerHeight() - 20
        if (pos_left < 0) {
          pos_left = target.offset().left + target.outerWidth() / 2 - 20
          tooltip.addClass('left')
        } else
          tooltip.removeClass('left')
        if (pos_left + tooltip.outerWidth() > $(window).width()) {
          pos_left = target.offset().left - tooltip.outerWidth() + target.outerWidth() / 2 + 20
          tooltip.addClass('right')
        } else
          tooltip.removeClass('right')
        if (pos_top < 0) {
          var pos_top = target.offset().top + target.outerHeight()
          tooltip.addClass('top')
        } else
          tooltip.removeClass('top')
        tooltip.css({
            left: pos_left,
            top: pos_top
          })
          .animate({
            top: '+=10',
            opacity: 1
          }, 50)
      }
      init_tooltip()
      $(window).resize(init_tooltip)
      var remove_tooltip = function() {
        tooltip.animate({
          top: '-=10',
          opacity: 0
        }, 50, function() {
          $(this).remove()
        })
        target.attr('title', tip)
      }
      target.bind('mouseleave', remove_tooltip)
      tooltip.bind('click', remove_tooltip)
    })	
}
