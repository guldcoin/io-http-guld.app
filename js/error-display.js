window.errorDisplay = {
  setError: function (errmess) {
    var errdiv = document.getElementById('err-div')
    if (errdiv.innerHTML.indexOf(errmess) === -1) {
      errdiv.innerHTML = `${errmess}${errdiv.innerHTML}`
    }
  },
  unsetError: function (errmess) {
    var errdiv = document.getElementById('err-div')
    errdiv.innerHTML = errdiv.innerHTML.replace(new RegExp(errmess, 'g'), '')
  },
  clearError: function () {
    var errdiv = document.getElementById('err-div')
    errdiv.innerHTML = ''
  }
}
