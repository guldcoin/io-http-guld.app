/* global localStorage:false */

window.qsLocalWindow = {
  parseQS: function (qs) {
    qs = qs || window.location.search
    var args = {}
    qs.replace('?', '').split('&').forEach(v => {
      var val = v.split('=')
      args[val[0]] = val[1]
    })
    return args
  },
  getValue: function (key, qs, defaultVal = undefined) {
    if (!window.hasOwnProperty(key) || window[key] === undefined) {
      qs = window.qsLocalWindow.parseQS(qs) || window.qsLocalWindow.parseQS()
      if (qs.hasOwnProperty(key)) {
        localStorage.setItem(key, qs[key])
        window[key] = qs[key]
      } else {
        try {
          window[key] = localStorage.getItem(key) || defaultVal
        } catch (e) {
          window[key] = defaultVal
        }
      }
    }
    return window[key]
  }
}
