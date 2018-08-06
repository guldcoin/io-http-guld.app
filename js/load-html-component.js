/* global fetch:false */

window.loadHTMLComponent = async function (component, eid) {
  return fetch(component).then(async response => {
    document.getElementById(eid).innerHTML = await response.text()
  }).catch(e => console.error) // eslint-disable-line
}
