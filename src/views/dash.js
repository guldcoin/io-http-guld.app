const { Decimal } = require('decimal.js')
const { showBalances, getBalances } = require('../components/balances.js')

module.exports.load = () => {
  var usdVal = new Decimal(0)
  var usdTotalValDiv = document.getElementById('total-usd-value')
  showBalances(b.guldname, 'GULD')
  getBalances(b.guldname, 'GULD').then(bals => {
    document.getElementById('guld-balance').innerHTML = `${bals[0].toString()} GULD`
    usdVal = usdVal.plus(bals[1].toString())
    usdTotalValDiv.innerHTML = `~ ${usdVal.toDecimalPlaces(2).toString()} USD`
    getBalances(b.guldname, 'GG').then(bals => {
      console.log(bals)
      document.getElementById('gg-balance').innerHTML = `${bals[0].toString()} GG`
      usdVal = usdVal.plus(bals[1].toString())
      usdTotalValDiv.innerHTML = `~ ${usdVal.toDecimalPlaces(2).toString()} USD`
    })
  })
}
