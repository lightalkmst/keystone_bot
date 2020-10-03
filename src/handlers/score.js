// !score to view your current score
module.exports = async ({
  messaging: {
    send_message,
  },
  info,
  util: {
    score,
  },
  checks: {
    registered_check,
    joined_check,
    in_progress_check,
  },
}) => {
  registered_check ()
  joined_check ()
  in_progress_check ()
  const scored = score (player)
  players = [
    ... A.filter (x => x.id !== id) (players),
    scored,
  ]
  const win = A.length (A.filter (x => x.result === 'win') (scored.matchups))
  const loss = A.length (A.filter (x => x.result === 'loss') (scored.matchups))
  const draw = A.length (A.filter (x => x.result === 'draw') (scored.matchups))
  await send_message (`${scored.username}#${scored.discriminator} [ ${scored.points} points | ${win} W - ${loss} L - ${draw} D ]`)
}
