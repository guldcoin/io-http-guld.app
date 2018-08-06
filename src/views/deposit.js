const QRCode = require('qrcode')

function load () {
  new QRCode(document.getElementById('qrcode'), 'http://guld.io')
}
