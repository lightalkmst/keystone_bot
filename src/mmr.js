// !mmr to set mmr
module.exports = async ({
  messaging: {
    send_message,
  },
  info: {
    player,
    split_message,
  },
  util,
  checks,
}) => {
  player.mmr = ~~ split_message [1]
  await send_message (`The MMR for ${player.id} has been set to ${split_message [1]}`)
  dirty = true
}
