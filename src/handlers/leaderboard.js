// !leaderboard to print out highest mmr players
module.exports = async ({
  messaging: {
    send_message,
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
  for (let i = 10 * ((~~ split_message [1] || 1) - 1); i < 10 * (~~ split_message [1] || 1); i++) {
    await send_message (user_string_by_id (leaderboard [i].id))
  }
}
