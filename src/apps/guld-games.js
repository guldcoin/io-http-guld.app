// TODO move this to gg-lib
function listOpenGames () { // eslint-disable-line no-unused-vars
  var lopenGames = []
  function checkGame (game) {
    return new Promise(resolve => {
      fs.readdir(`/BLOCKTREE/${self.guldname}/ledger/GG/Games/LOTTERY/${game}`, (err, gfiles) => {
        if (err) resolve()
        if (gfiles.indexOf('GUESS.txt') === -1) {
          lopenGames.push(game)
          resolve()
        } else resolve()
      })
    })
  }

  return new Promise((resolve, reject) => {
    fs.readdir(`/BLOCKTREE/${self.guldname}/ledger/GG/Games/LOTTERY`, (err, games) => {
      if (err) return resolve([])
      Promise.all(games.map(checkGame)).then(() => {
        resolve(lopenGames)
      })
    })
  })
}
