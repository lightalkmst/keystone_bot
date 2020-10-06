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
  checks: {
    not_in_progress_check,
  },
}) => {
  not_in_progress_check ()
  player.mmr = ~~ split_message [2]
  await send_message (`The MMR for ${player.id} has been set to ${split_message [2]}`)
  dirty = true
}
