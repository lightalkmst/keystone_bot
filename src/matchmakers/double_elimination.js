global.brackets = null
module.exports = players => {
  const get_matchups = () => {
    return A.mapi (i => x => {
      const wi = A.try_find_index (y => y.id === x.id) (brackets.winners)
      if (wi) {
        return {
          ... x,
          matchups: [
            brackets.winners [wi % 2 ? wi + 1 : wi - 1]
            ? {
              id: brackets.winners [wi % 2 ? wi + 1 : wi - 1].id,
              result: 'pending',
            }
            : {result: 'bye'}
          ]
        }
      }
      const li = A.try_find_index (y => y.id === x.id) (brackets.winners)
      if (li) {
        return {
          ... x,
          matchups: [
            brackets.losers [li % 2 ? li + 1 : li - 1]
            ? {
              id: brackets.losers [li % 2 ? li + 1 : li - 1].id,
              result: 'pending',
            }
            : {result: 'bye'}
          ]
        }
      }
      return {result: 'bye'}
    })
  }

  // generates bracket on first run, just updates and outputs resulting matches in subsequent runs
  if (! brackets) {
    const players2 = seed (players)
    brackets = {
      winners: A.map (x => x && x.id) (players2),
      losers: [],
    }
    return get_matchups ()
  }

  const pred_won_round = player_id => {
    const join = A.try_find (x => x.id === player_id) (joined)
    return join && A.contains (join.matchups [0].result) (['win', 'bye'])
  }

  if (brackets.winners.length) {
    brackets = {
      winners: A.filter (pred_won_round) (brackets.winners),
      losers: A.fold (a => h => [... a, h [0], h [1]]) ([]) (A.zip (A.filter (pred_won_round) (brackets.losers)) (A.rev (A.filter (F.neg (pred_won_round)) (brackets.winners)))),
    }
  }
  else {
    brackets = {
      ... brackets,
      losers: A.filter (pred_won_round) (brackets.losers),
    }
  }

  if (brackets.winners.length === 1 && brackets.losers.length === 1) {
    const wid = brackets.winners [0].id
    const lid = brackets.losers [0].id
    return A.map (x =>
      x.id === wid
      ? {
        id: lid,
        result: 'pending',
      }
      : x.id === lid
      ? {
        id: wid,
        result: 'pending',
      }
      : {result: 'bye'}
    ) (joined)
  }

  return get_matchups ()
}
