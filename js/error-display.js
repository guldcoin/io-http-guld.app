window.errorDisplay = {
  setError: function (errmess) {
    var errdiv = document.getElementById('err-div')
    if (errdiv.innerHTML.indexOf(errmess) === -1) {
      errdiv.innerHTML = `${errmess}${errdiv.innerHTML}`
    }
    if (errdiv.className.indexOf('d-none') > -1) errdiv.className = errdiv.className.replace(/d-none/g, '')
  },
  unsetError: function (errmess) {
    var errdiv = document.getElementById('err-div')
    errdiv.innerHTML = errdiv.innerHTML.replace(new RegExp(errmess, 'g'), '')
    if (errdiv.className.indexOf('d-none') === -1) errdiv.className = errdiv.className + ' d-none'
  },
  clearError: function () {
    var errdiv = document.getElementById('err-div')
    errdiv.innerHTML = ''
    if (errdiv.className.indexOf('d-none') === -1) errdiv.className = errdiv.className + ' d-none'
  }
}

