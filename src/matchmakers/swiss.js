const edmondsBlossom = require ('edmonds-blossom')

module.exports = players => {
  const maxDiff = round * 3

  const matches = (() => {
    const matches = []
    for (let i = 0; players [i]; i++) {
      for (let i2 = i + 1; players [i2]; i2++) {
        matches.push ([i, i2, A.for_all (x => x.id !== players [i2].id) (players [i].matchups) ? maxDiff - Math.abs (players [i].points - players [i2].points) : 0])
      }
    }
    return edmondsBlossom (matches)
  }) ()

  return A.mapi (i => x => ({
    ... x,
    matchups: [
      matches [i] === -1
      ? {
        result: 'bye',
      }
      : {
        id: players [matches [i]].id,
        result: 'pending',
      },
      ... x.matchups,
    ],
    playing: matches [i] === -1,
  })) (players)
}
