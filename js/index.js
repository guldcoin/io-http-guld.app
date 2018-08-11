document.addEventListener('DOMContentLoaded', async function () {
  await loadHTMLComponent('/header.html', 'header-wrapper')
  await loadHTMLComponent('/footer.html', 'footer')
  await loadPerspective()
  window.commodity = qsLocalWindow.getValue('commodity', undefined, 'GULD')
  await changeCommodity(commodity)
  await showMemberStatus()
  await showTransactionTypes()
  await setTitleTag()
  await showMobileTooltip()
})

async function showBalanceDetails (gname) {
  gname = gname || observer.user.username
  window.balances = await getBalances(gname)
  var balDetails = document.getElementById('balance-details')
  if (balances.hasOwnProperty(gname) && balDetails) {
    balDetails.innerHTML = ""
    var cdiv
    cdiv = `<div id="balance-detail-card" class="card balance-card"><div class="card-header"><h4>Balances</h4></div>
<div id="balance-detail-card-body" class="card-body table-responsive">
<table class="table">`
    var matrix = await getBalanceMatrix(gname)
    // Assets
    cdiv = `${cdiv}\n<tr class="table-active"><th></th>`
    Object.keys(matrix).forEach(async c => {
      cdiv = `${cdiv}\n<th class="color-guld">${c}</th>`
    })
    if (balances[gname].hasOwnProperty(`Assets`)) {
      cdiv = `${cdiv}\n</tr><tr class="table-success"><th>Assets</th>`
      await Promise.all(Object.keys(matrix).map(async c => {
        var assets = new ledgerTypes.Amount(0, c)
        if (matrix[c].Assets && matrix[c].Assets.balance) assets = matrix[c].Assets.balance
        var val = await getUSDValue(assets, c)
        cdiv = `${cdiv}\n<td class="ledger-amount" commodity="${c}"><span title="$${val.toNumber().toLocaleString()}" rel="tooltip">${assets.value.toNumber().toLocaleString()}</span></td>`
      }))
      cdiv = `${cdiv}\n</tr>`
    }
    if (balances[gname].hasOwnProperty(`Liabilities`)) {
      cdiv = `${cdiv}\n</tr><tr class="table-danger"><th>Liabilities</th>`
      await Promise.all(Object.keys(matrix).map(async c => {
        var assets = new ledgerTypes.Amount(0, c)
        if (matrix[c].Liabilities && matrix[c].Liabilities.balance) assets = matrix[c].Liabilities.balance
        var val = await getUSDValue(assets, c)
        cdiv = `${cdiv}\n<td class="ledger-amount" commodity="${c}"><span title="$${val.toNumber().toLocaleString()}" rel="tooltip">${assets.value.toNumber().toLocaleString()}</span></td>`
      }))
      cdiv = `${cdiv}\n</tr>`
    }
    if (balances[gname].hasOwnProperty(`Equity`) || matrix.GG && matrix.GG.Equity || matrix.GULD && matrix.GULD.Equity) {
      cdiv = `${cdiv}\n</tr><tr><th>Equity</th>`
      await Promise.all(Object.keys(matrix).map(async c => {
        var assets = new ledgerTypes.Amount(0, c)
        if (matrix[c].Equity && matrix[c].Equity.balance) assets = matrix[c].Equity.balance
        var val = await getUSDValue(assets, c)
        cdiv = `${cdiv}\n<td class="ledger-amount" commodity="${c}"><span title="$${val.toNumber().toLocaleString()}" rel="tooltip">${assets.value.toNumber().toLocaleString()}</span></td>`
      }))
      cdiv = `${cdiv}\n</tr>`
    }
    if (balances[gname].hasOwnProperty(`Income`)) {
      cdiv = `${cdiv}\n</tr><tr class="table-info"><th>Income</th>`
      await Promise.all(Object.keys(matrix).map(async c => {
        var assets = new ledgerTypes.Amount(0, c)
        if (matrix[c].Income && matrix[c].Income.balance) assets = matrix[c].Income.balance
        var val = await getUSDValue(assets, c)
        cdiv = `${cdiv}\n<td class="ledger-amount" commodity="${c}"><span title="$${val.toNumber().toLocaleString()}" rel="tooltip">${assets.value.toNumber().toLocaleString()}</span></td><`
      }))
      cdiv = `${cdiv}\n</tr>`
    }
    if (balances[gname].hasOwnProperty(`Expenses`)) {
      cdiv = `${cdiv}\n</tr><tr class="table-warning"><th>Expenses</th>`
      await Promise.all(Object.keys(matrix).map(async c => {
        var assets = new ledgerTypes.Amount(0, c)
        if (matrix[c].Expenses && matrix[c].Expenses.balance) assets = matrix[c].Expenses.balance
        var val = await getUSDValue(assets, c)
        cdiv = `${cdiv}\n<td class="ledger-amount" commodity="${c}"><span title="$${val.toNumber().toLocaleString()}" rel="tooltip">${assets.value.toNumber().toLocaleString()}</span></td>`
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
  <div id="member-detail-card-body" class="card-body table-responsive">
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
      cdiv = `${cdiv}\n<tr><th class="color-guld">Email</th><td class="color-guld"><a href="mailto:${observer.user.email}">${observer.user.email}</td></tr>`
    }
    if (observer.user.signingkey) {
      cdiv = `${cdiv}\n<tr><th class="color-guld">PGP Key</th><td class="color-guld"><a href="/keys/pgp/${observer.user.username}/${observer.user.signingkey}.asc" download>${observer.user.signingkey}</td></tr>`
    }
    if (observer.aliases) {
      cdiv = `${cdiv}\n<tr><th class="color-guld">Aliases</th><td class="color-guld"><ul class="list-inline">`
      if (observer.aliases.github) {
        cdiv = `${cdiv}\n<li class="list-inline-item"><a href="https://github.com/${observer.aliases.github}" target="_blank"><i class="fab fa-github"></i></li>`
      }
      if (observer.aliases.bitbucket) {
        cdiv = `${cdiv}\n<li class="list-inline-item"><a href="https://bitbucket.org/${observer.aliases.bitbucket}" target="_blank"><i class="fab fa-bitbucket"></i></li>`
      }
      if (observer.aliases.npm) {
        cdiv = `${cdiv}\n<li class="list-inline-item"><a href="https://npmjs.org/~${observer.aliases.npm}" target="_blank"><i class="fab fa-npm"></i></li>`
      }
      if (observer.aliases.telegram) {
        cdiv = `${cdiv}\n<li class="list-inline-item"><a href="https://t.me/${observer.aliases.telegram}" target="_blank"><i class="fab fa-telegram-plane"></i></li>`
      }
      if (observer.aliases.facebook) {
        cdiv = `${cdiv}\n<li class="list-inline-item"><a href="https://facebook.com/${observer.aliases.facebook}" target="_blank"><i class="fab fa-facebook-f"></i></li>`
      }
      if (observer.aliases.twitter) {
        cdiv = `${cdiv}\n<li class="list-inline-item"><a href="https://twitter.com/${observer.aliases.twitter}" target="_blank"><i class="fab fa-twitter"></i></li>`
      }
      if (observer.aliases.reddit) {
        cdiv = `${cdiv}\n<li class="list-inline-item"><a href="https://reddit.com/user/${observer.aliases.reddit}" target="_blank"><i class="fab fa-reddit"></i></li>`
      }
      if (observer.aliases.youtube) {
        cdiv = `${cdiv}\n<li class="list-inline-item"><a href="https://youtube.com/channel/${observer.aliases.youtube}" target="_blank"><i class="fab fa-youtube"></i></li>`
      }
      if (observer.aliases.twitch) {
        cdiv = `${cdiv}\n<li class="list-inline-item"><a href="https://twitch.tv/${observer.aliases.twitch}" target="_blank"><i class="fab fa-twitch"></i></li>`
      }
      if (observer.aliases.instagram) {
        cdiv = `${cdiv}\n<li class="list-inline-item"><a href="https://instagram.com/${observer.aliases.instagram}" target="_blank"><i class="fab fa-instagram"></i></li>`
      }
      if (observer.aliases.hackernews) {
        cdiv = `${cdiv}\n<li class="list-inline-item"><a href="https://news.ycombinator.com/user?id=${observer.aliases.hackernews}" target="_blank"><i class="fab fa-hacker-news-square"></i></li>`
      }
      if (observer.aliases.keybase) {
        cdiv = `${cdiv}\n<li class="list-inline-item"><a href="https://keybase.io/${observer.aliases.keybase}" target="_blank"><i class="fab fa-keybase"></i></li>`
      }
      cdiv = `${cdiv}\n</ul></td></tr>`
    }
    cdiv = `${cdiv}\n</table></div>`
  }
  if (memDetails && cdiv) memDetails.innerHTML = `${cdiv}`
}

