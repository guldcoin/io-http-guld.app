const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const { getFS } = require('guld-fs')
const home = require('user-home')
const path = require('path')
global.openpgp = require('openpgp')
const { Decimal } = require('decimal.js')
global.Decimal = Decimal
const keyringPGP = require('keyring-pgp')
const ledgerTypes = require('ledger-types')
const { setEquity } = require('guld-ledger-cache')
var fs

app.use('/js', express.static('js'))
app.use('/dotfiles', express.static('dotfiles', {dotfiles: 'allow'}))
app.use('/ledger', express.static('ledger'))
app.use('/keys', express.static('keys'))
app.use('/market', express.static('market'))
app.use('/css', express.static('css'))
app.use('/img', express.static('img'))
app.use(bodyParser.json())

app.get('/', function(req,res){
 res.sendfile(__dirname + '/index.html');
})

app.get('/index.html', function(req,res){
 res.sendfile(__dirname + '/index.html');
})

app.get('/apply.html', function(req,res){
 res.sendfile(__dirname + '/apply.html');
})

app.get('/send.html', function(req,res){
 res.sendfile(__dirname + '/send.html');
})

app.get('/grant.html', function(req,res){
 res.sendfile(__dirname + '/grant.html');
})

app.get('/register-individual.html', function(req,res){
 res.sendfile(__dirname + '/register-individual.html');
})

app.get('/convert.html', function(req,res){
 res.sendfile(__dirname + '/convert.html');
})

app.get('/deposit.html', function(req,res){
 res.sendfile(__dirname + '/deposit.html');
})

app.get('/burn.html', function(req,res){
 res.sendfile(__dirname + '/burn.html');
})

app.get('/header.html', function(req,res){
 res.sendfile(__dirname + '/header.html');
})

app.get('/footer.html', function(req,res){
 res.sendfile(__dirname + '/footer.html');
})

app.get('/transaction-submit.html', function(req,res){
 res.sendfile(__dirname + '/transaction-submit.html');
})

app.post('/pushtx/transfer', async function(req, res) {
  fs = fs || await getFS()
  var sender = req.body.transfer.match(/[ ].*:Assets.*[ ]*[0-9,.-] [A-Z]+/m)
  if (sender) {
    sender = sender[0].trim().split(':')
    var commodity = sender[1].split(' ').slice(-1)[0]
    sender = sender[0]
  } else return res.status(404).send('Not a known transaction type.')
  var keyfiles = await fs.readdir(path.join(home, 'keys', 'pgp', sender))
  if (!keyfiles || keyfiles.length === 0) res.status(401).send('Not a known sender.')
  keyfiles = keyfiles.map(k => k.replace('.asc', ''))
  var pubkey = await getPGPKey(sender, keyfiles[0])
  var verified = await keyringPGP.verify(req.body.transfer, undefined, keyfiles[0])
  if (!verified) {
     return res.status(401).send('Bad signature.')
  } else {
    var msg = openpgp.cleartext.readArmored(req.body.transfer).text
    var amount = ledgerTypes.Transaction.getAmount(msg)
    var time = ledgerTypes.Transaction.getTimestamp(msg)
    var restr = `[ ]*${sender}:Assets[ ]*${amount} ${commodity}`
    var re = new RegExp(restr)
    var bals = await getBalances(sender, commodity)
    if (!msg.match(re) || amount >= 0 || bals[sender][`Assets`].__bal[commodity].value.toNumber() + amount < 0) {
      return res.status(400).send('Invalid transaction.')
    } else {
      fs.readFile(`ledger/${commodity}/${sender}/${time}.dat`).then(f => {
        return res.status(400).send('transaction already known')
      }).catch(async e => {
        await fs.writeFile(path.join(home, `ledger/${commodity}/${sender}/${time}.dat.asc`), req.body.transfer)
        await fs.writeFile(path.join(home, `ledger/${commodity}/${sender}/${time}.dat`), msg)
        await fs.appendFile(path.join(home, `ledger/journal.cache`), `\n${msg}`)
        await setEquity()
        res.send(`ledger/${commodity}/${sender}/${time}.dat`)
      })
    }
  }
})

async function getPGPKey (gname, fpr) {
  fs = fs || await getFS()
  return keyringPGP.getPublicKey(fpr).then(pubkey => pubkey).catch(async e => {
    var pubkey = await fs.readFile(path.join(home, 'keys' , 'pgp', gname, `${fpr}.asc`), 'utf-8')
    await keyringPGP.importPublicKey(pubkey)
    return pubkey
  })
}

async function getBalances () {
  var equity_cache = await fs.readFile(path.join(home, 'ledger', 'equity.cache'), 'utf-8')
  return ledgerTypes.Account.createFromEquity(equity_cache)
}

app.listen(3000, () => console.log('Debug guld app listening on port 3000'))
