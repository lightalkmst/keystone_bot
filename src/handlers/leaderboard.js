// !leaderboard to print out highest mmr players
module.exports = async ({
  messaging: {
    send_messages,
  },
  info: {
    split_message,
  },
  util: {
    user_string_by_id,
  },
  checks,
}) => {
  const leaderboard = A.sort (x => y => y.mmr - x.mmr) (players)
  const idxs = A.range (10 * ((~~ split_message [1] || 1) - 1)) (10 * (~~ split_message [1] || 1))
  const ps = A.filter (F.id) (A.map (i => leaderboard [i]) (idxs))
  await send_messages ([
    `The top players are:`,
    ... await A.P.p.map (async x => `${await user_string_by_id (x.id)}: ${x.mmr}`) (ps),
  ])
}
