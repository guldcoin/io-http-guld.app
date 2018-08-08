const express = require('express')
const app = express()
const bodyParser = require('body-parser')

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

app.get('/send.html', function(req,res){
 res.sendfile(__dirname + '/send.html');
})

app.get('/grant.html', function(req,res){
 res.sendfile(__dirname + '/grant.html');
})

app.get('/register.html', function(req,res){
 res.sendfile(__dirname + '/register.html');
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

app.post('/pushtx/transfer', function(req, res) {
  console.log(req.body)
  res.send('txid')
})

app.listen(3000, () => console.log('Debug guld app listening on port 3000'))
