// !score to view your current score
module.exports = async ({
  messaging: {
    send_message,
  },
  info,
  util,
  checks: {
    registered_check,
    joined_check,
    in_progress_check,
  },
}) => {
  const score = p =>
    p.points !== undefined
    ? p
    : {
      ... p,
      points:
        F.p (p.matchups) (
          A.map (x =>
            F.match (x.result)
            .case ('win') (() => rules.points_per_win)
            .case ('loss') (() => rules.points_per_loss)
            .case ('draw') (() => rules.points_per_draw)
            .case ('bye') (() => rules.points_per_win)
            .case ('drop') (() => rules.points_per_loss)
            .default (() => 0)
          )
          >> A.fold (F ['+']) (0)
        )
      ,
    }
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
