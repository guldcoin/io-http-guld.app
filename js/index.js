const NAMEWARN = 'Guld name is not available or valid, choose another.'
const ATYPES = new Array('Assets', 'Liabilities', 'Equity', 'Expenses', 'Income')

document.addEventListener('DOMContentLoaded', async function () {
  await loadHTMLComponent('/header.html', 'header-wrapper')
  await loadHTMLComponent('/footer.html', 'footer')
  await loadPerspective()
  window.commodity = qsLocalWindow.getValue('commodity', undefined, 'GULD')
  await changeCommodity(commodity)
  await showTransactionTypes()
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
  var persp = await getPerspective(pers)
  if (persp) {
    errorDisplay.unsetError(`Could not find perspective`)
    window.observer = persp
    await loadGuldVals()
    await showBalances()
    await showMemberDetails()
  } else {
    errorDisplay.setError(`Could not find perspective`)
  }
}

async function loadGuldVals () {
  var gnameDiv = document.getElementById('guldname-new')
  if (gnameDiv) gnameDiv.value = observer.user.username
  gnameDiv = document.getElementById('guldname')
  if (gnameDiv) gnameDiv.innerText = observer.user.username
  return observer
}

async function showBalances (gname, comm="GULD") {
  gname = gname || observer.user.username
  window.balances_cache = await getBalances(gname, "")
  var balDiv = document.getElementById('balance')
  if (balances_cache.hasOwnProperty(gname) && balances_cache[gname].hasOwnProperty(`${gname}:Assets`)) {
    var acs = document.getElementsByClassName('ledger-amount')
    for (var a in acs) {
      if (acs[a].innerText) {
        var c = acs[a].commodity || acs[a].innerText.split(' ').slice(-1)
        var bal = balances_cache[observer.user.username][`${observer.user.username}:Assets`][c]
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
  if (showBalanceDetails) await showBalanceDetails(gname)
}

async function getUSDValue (gname, category, comm) {
  var assets = balances_cache[gname][`${gname}:${category}`][comm]
  var price = await getCommodityPrice(comm, 'USD', gname)
  var val = new Decimal(0)
  if (price && assets && price.value && assets.value) val = price.value.mul(assets.value).mul(new Decimal(100)).round(2).div(new Decimal(100))
  return val
}

async function getBalanceMatrix (gname) {
  var matrix = {}
  for (var typ in ATYPES) {
    var t = ATYPES[typ]
    if (balances_cache[gname].hasOwnProperty(`${gname}:${t}`)) {
      await Promise.all(balances_cache[gname][`${gname}:${t}`].commodities().map(async c => {
        var assets = balances_cache[gname][`${gname}:${t}`][c]
        var val = await getUSDValue(gname, t, c)
        matrix[c] = matrix[c] || {}
        matrix[c][t] = matrix[c][t] || {}
        matrix[c][t].value = val
        matrix[c][t].balance = assets
      }))
    }
  }
  return matrix
}

async function showBalanceDetails (gname) {
  gname = gname || observer.user.username
  window.balances_cache = await getBalances(gname)
  var balDetails = document.getElementById('balance-details')
  if (balances_cache.hasOwnProperty(gname) && balDetails) {
    balDetails.innerHTML = ""
    var cdiv
    cdiv = `<div id="balance-detail-card" class="card balance-card"><div class="card-header"><h4>Balances</h4></div>
<div id="balance-detail-card-body" class="card-body">
<table class="table">`
    var matrix = await getBalanceMatrix(gname)
    // Assets
    cdiv = `${cdiv}\n<tr class="table-active"><th></th>`
    Object.keys(matrix).forEach(async c => {
      cdiv = `${cdiv}\n<th class="color-guld">${c}</th>`
    })
    if (balances_cache[gname].hasOwnProperty(`${gname}:Assets`)) {
      cdiv = `${cdiv}\n</tr><tr class="table-success"><th>Assets</th>`
      await Promise.all(Object.keys(matrix).map(async c => {
        var assets = balances_cache[gname][`${gname}:Assets`][c] || new ledgerTypes.Amount(0, c)
        var val = await getUSDValue(gname, 'Assets', c)
        cdiv = `${cdiv}\n<td class="ledger-amount" commodity="${c}" title="$${val.toNumber().toLocaleString()}">${assets.value.toNumber().toLocaleString()}</td>`
      }))
      cdiv = `${cdiv}\n</tr>`
    }
    if (balances_cache[gname].hasOwnProperty(`${gname}:Liabilities`)) {
      cdiv = `${cdiv}\n</tr><tr class="table-danger"><th>Liabilities</th>`
      await Promise.all(Object.keys(matrix).map(async c => {
        var assets = balances_cache[gname][`${gname}:Liabilities`][c] || new ledgerTypes.Amount(0, c)
        var val = await getUSDValue(gname, 'Liabilities', c)
        cdiv = `${cdiv}\n<td class="ledger-amount" commodity="${c}" title="$${val.toNumber().toLocaleString()}">${assets.value.toNumber().toLocaleString()}</td>`
      }))
      cdiv = `${cdiv}\n</tr>`
    }
    if (balances_cache[gname].hasOwnProperty(`${gname}:Equity`)) {
      cdiv = `${cdiv}\n</tr><tr><th>Equity</th>`
      await Promise.all(Object.keys(matrix).map(async c => {
        var assets = balances_cache[gname][`${gname}:Equity`][c] || new ledgerTypes.Amount(0, c)
        var val = await getUSDValue(gname, 'Equity', c)
        cdiv = `${cdiv}\n<td class="ledger-amount" commodity="${c}" title="$${val.toNumber().toLocaleString()}">${assets.value.toNumber().toLocaleString()}</td>`
      }))
      cdiv = `${cdiv}\n</tr>`
    }
    if (balances_cache[gname].hasOwnProperty(`${gname}:Income`)) {
      cdiv = `${cdiv}\n</tr><tr class="table-info"><th>Income</th>`
      await Promise.all(Object.keys(matrix).map(async c => {
        var assets = balances_cache[gname][`${gname}:Income`][c] || new ledgerTypes.Amount(0, c)
        var val = await getUSDValue(gname, 'Income', c)
        cdiv = `${cdiv}\n<td class="ledger-amount" commodity="${c}" title="$${val.toNumber().toLocaleString()}">${assets.value.toNumber().toLocaleString()}</td>`
      }))
      cdiv = `${cdiv}\n</tr>`
    }
    if (balances_cache[gname].hasOwnProperty(`${gname}:Expenses`)) {
      cdiv = `${cdiv}\n</tr><tr class="table-warning"><th>Expenses</th>`
      await Promise.all(Object.keys(matrix).map(async c => {
        var assets = balances_cache[gname][`${gname}:Expenses`][c] || new ledgerTypes.Amount(0, c)
        var val = await getUSDValue(gname, 'Expenses', c)
        cdiv = `${cdiv}\n<td class="ledger-amount" commodity="${c}" title="$${val.toNumber().toLocaleString()}">${assets.value.toNumber().toLocaleString()}</td>`
      }))
      cdiv = `${cdiv}\n</tr>`
    }
    cdiv = `${cdiv}\n</table></div>`
    if (cdiv) balDetails.innerHTML = `${balDetails.innerHTML}\n${cdiv}`
  }
}
//usdValDiv.innerHTML = `~ ${assets.value.toDecimalPlaces(2).toString()} USD`

async function showMemberDetails (gname) {
  gname = gname || observer.user.username
  var memDetails = document.getElementById('member-details')
  var cdiv
  if (memDetails && window.observer && observer.user) {
    cdiv = `<div id="member-detail-card" class="card member-card"><div class="card-header"><h4>Profile</h4></div>
  <div id="member-detail-card-body" class="card-body">
  <table class="table">`
    if (observer.user.name) {
      cdiv = `${cdiv}\n<tr><th class="color-guld">Full Name</th><td class="color-guld">${observer.user.name}</td></tr>`
    }
    if (observer.user.location) {
      cdiv = `${cdiv}\n<tr><th class="color-guld">Location</th><td class="color-guld">${observer.user.location}</td></tr>`
    }
    if (observer.user.bio) {
      cdiv = `${cdiv}\n<tr><th class="color-guld">Bio</th><td class="color-guld">${observer.user.bio}</td></tr>`
    }
    if (observer.user.website) {
      var url
      if (observer.user.website.startsWith('http')) url = observer.user.website
      else url = `http://${observer.user.website}`
      cdiv = `${cdiv}\n<tr><th class="color-guld">Website</th><td class="color-guld"><a href="${url}" target="_blank">${observer.user.website}</a></td></tr>`
    }
    if (observer.user.email) {
      cdiv = `${cdiv}\n<tr><th class="color-guld">Email</th><td class="color-guld">${observer.user.email}</td></tr>`
    }
    if (observer.user.signingkey) {
      cdiv = `${cdiv}\n<tr><th class="color-guld">PGP Key</th><td class="color-guld">${observer.user.signingkey}</td></tr>`
    }
    if (observer.aliases) {
      cdiv = `${cdiv}\n<tr><th class="color-guld">Aliases</th><td class="color-guld"><ul class="list-inline">`
      if (observer.aliases.github) {
        cdiv = `${cdiv}\n<li class="list-inline-item"><a href="https://github.com/${observer.aliases.github}"><i class="fab fa-github"></i></li>`
      }
      if (observer.aliases.bitbucket) {
        cdiv = `${cdiv}\n<li class="list-inline-item"><a href="https://bitbucket.org/${observer.aliases.bitbucket}"><i class="fab fa-bitbucket"></i></li>`
      }
      if (observer.aliases.npm) {
        cdiv = `${cdiv}\n<li class="list-inline-item"><a href="https://npmjs.org/~${observer.aliases.npm}"><i class="fab fa-npm"></i></li>`
      }
      if (observer.aliases.telegram) {
        cdiv = `${cdiv}\n<li class="list-inline-item"><a href="https://t.me/${observer.aliases.github}"><i class="fab fa-telegram-plane"></i></li>`
      }
      if (observer.aliases.facebook) {
        cdiv = `${cdiv}\n<li class="list-inline-item"><a href="https://facebook.com/${observer.aliases.facebook}"><i class="fab fa-facebook-f"></i></li>`
      }
      if (observer.aliases.twitter) {
        cdiv = `${cdiv}\n<li class="list-inline-item"><a href="https://twitter.com/${observer.aliases.twitter}"><i class="fab fa-twitter"></i></li>`
      }
      if (observer.aliases.reddit) {
        cdiv = `${cdiv}\n<li class="list-inline-item"><a href="https://reddit.com/user/${observer.aliases.reddit}"><i class="fab fa-reddit"></i></li>`
      }
      if (observer.aliases.youtube) {
        cdiv = `${cdiv}\n<li class="list-inline-item"><a href="https://youtube.com/channel/${observer.aliases.reddit}"><i class="fab fa-youtube"></i></li>`
      }
      if (observer.aliases.twitch) {
        cdiv = `${cdiv}\n<li class="list-inline-item"><a href="https://twitch.tv/${observer.aliases.twitch}"><i class="fab fa-twitch"></i></li>`
      }
      if (observer.aliases.instagram) {
        cdiv = `${cdiv}\n<li class="list-inline-item"><a href="https://instagram.com/${observer.aliases.instagram}"><i class="fab fa-instagram"></i></li>`
      }
      if (observer.aliases.hackernews) {
        cdiv = `${cdiv}\n<li class="list-inline-item"><a href="https://news.ycombinator.com/user?id=${observer.aliases.hackernews}"><i class="fab fa-hacker-news-square"></i></li>`
      }
      if (observer.aliases.keybase) {
        cdiv = `${cdiv}\n<li class="list-inline-item"><a href="https://keybase.io/${observer.aliases.keybase}"><i class="fab fa-keybase"></i></li>`
      }
      cdiv = `${cdiv}\n</ul></td></tr>`
    }
    cdiv = `${cdiv}\n</table></div>`
  }
  if (memDetails && cdiv) memDetails.innerHTML = `${memDetails.innerHTML}\n${cdiv}`
}


async function getEquityCache () {
  if (!window.hasOwnProperty('equity_cache')) {
    var response = await fetch(`ledger/GULD/equity.cache`)
    if (response.ok) {
      window.equity_cache = await response.text()
      return equity_cache
    } else {
      throw new Error(`Could not reach the API`)
    }
  }
  return equity_cache
}

async function getBalances (gname, comm="") {
  gname = gname || observer.user.username
  window.equity_cache = await getEquityCache()
  var restr = `^.*${gname}.*${comm}$`
  var restr2 = `^\ *${gname}:.*${comm}$`
  var restr3 = `^.*:${gname}[: ]{1}.*${comm}$`
  try {
    var matches = equity_cache.match(new RegExp(restr, 'gm')).filter(m => m.match(new RegExp(restr2, 'gm')) || m.match(new RegExp(restr3, 'gm')))
  } catch (e) {
    balances_cache[gname] = balances_cache[gname] || {}
    balances_cache[gname][`${gname}:Assets`] = new ledgerTypes.Balance(new ledgerTypes.Amount(0, comm))
    return balances_cache
  }
  window.balances_cache = window.balances_cache || {}
  balances_cache[gname] = {}
  matches.forEach(m => {
    var sm = m.trim().split("  ")
    var amt = sm.slice(-1)[0].trim().split(' ')
    balances_cache[gname][sm[0].trim()] = balances_cache[gname][sm[0].trim()] || new ledgerTypes.Balance({})
    var amount = new ledgerTypes.Amount(amt[0].replace(/,/g, ''), amt[1])
    balances_cache[gname][sm[0].trim()] = balances_cache[gname][sm[0].trim()].addAmount(amount)
  })
  return balances_cache
}

async function changePerspective (per) {
  delete window.perspective
  per = per.toLowerCase()
  window.perspective = qsLocalWindow.getValue('perspective', `?perspective=${per}`, per)
  await loadPerspective(per)
  $('#login-dropdown-toggle').dropdown("toggle");
}

async function changeCommodity (comm) {
  delete window.commodity
  comm = comm.toUpperCase()
  window.commodity = qsLocalWindow.getValue('commodity', `?commodity=${comm}`, comm)
  var acs = document.getElementsByClassName('active-commodity')
  for (var a in acs) {
    if (balances_cache[observer.user.username].hasOwnProperty(`${observer.user.username}:Assets`) && balances_cache[observer.user.username][`${observer.user.username}:Assets`].hasOwnProperty(commodity)) {
      var bal = balances_cache[observer.user.username][`${observer.user.username}:Assets`][commodity].value.toNumber().toLocaleString()
      if (bal) acs[a].textContent = `${bal} ${commodity}`
      else acs[a].textContent = `0 ${commodity}`
    } else acs[a].textContent = `0 ${commodity}`
    acs[a].commodity = commodity
  }
  await showBalances(perspective, commodity)
  await showTransactionTypes()
  return false
}

async function getCommodityPrice (base='GULD', quote='USD', oname) {
  oname = oname || observer.user.name
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
          var guldPrice = await getCommodityPrice(base, 'GULD', oname)
          var guldUSDPrice = await getCommodityPrice('GULD', 'USD', oname)
          window.prices[quote][base] = guldUSDPrice.div(new ledgerTypes.Amount(guldPrice.value, quote))
        }
      }
    }).catch(async e => {
      if (base !== 'GULD' && quote === 'USD') {
        var guldPrice = await getCommodityPrice(base, 'GULD', oname)
        var guldUSDPrice = await getCommodityPrice('GULD', 'USD', oname)
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
    'GG': ['send', 'burn'],
    'ISYSD': ['send'],
//    'BTC': ['deposit', 'convert'],
    'GULD': ['send'] // , 'register', 'grant'
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

