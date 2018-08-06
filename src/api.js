module.exports.apiMessageHandler = (msg) => {
  switch (msg.cmd) {
    case 'getuser':
      var unlocked = false
      if (keyring.privateKeys.getForId(self.guldfpr) &&
        self.keyring.privateKeys.getForId(self.guldfpr).primaryKey &&
        self.keyring.privateKeys.getForId(self.guldfpr).primaryKey.isDecrypted) { unlocked = true }
      isRegistered(self.guldname).then(registered => {
        port.postMessage({
          'cmd': 'gotuser',
          'data': {
            'name': self.guldname,
            'email': self.guldmail,
            'fpr': self.guldfpr,
            'ghavatar': self.ghavatar,
            'unlocked': unlocked,
            'registered': registered
          }
        })
      })
      break
    case 'balance':
      self.getBalance(self.guldname, true).then(bal => {
        port.postMessage({
          'cmd': 'balance',
          'data': {
            'name': self.guldname,
            'balance': bal
          }
        })
      })
      break
    case 'price':
      var comm = 'GULD'
      if (msg.hasOwnProperty('commodity')) comm = msg.commodity
      var quote = '$'
      if (msg.hasOwnProperty('quote')) quote = msg.quote
      blocktree.getPrice(comm, quote).then(price => {
        port.postMessage({
          'cmd': 'price',
          'data': {
            'commodity': comm,
            'quote': quote,
            'price': price
          }
        })
      })
      break
    case 'readdir':
      var path = `/BLOCKTREE/${self.guldname}/`
      if (msg.hasOwnProperty('path')) {
        path = `/BLOCKTREE/${self.guldname}/${msg.path}`.replace(`/BLOCKTREE/${self.guldname}/BLOCKTREE/${self.guldname}`, `/BLOCKTREE/${self.guldname}`)
      }
      fs.readdir(path, (err, contents) => {
        if (err) {
          port.postMessage({
            'error': err
          })
        } else {
          port.postMessage({
            'cmd': 'readdir',
            'data': {
              'path': path,
              'contents': contents
            }
          })
        }
      })
      break
    default:
      port.postMessage({
        'error': 'unknown message type'
      })
  }
}

