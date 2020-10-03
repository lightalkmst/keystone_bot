// !play signals that the match for the player and their partner has started so the bot can nag people that haven't started their game
module.exports = async ({
  messaging: {
    send_messages,
    log_command,
  },
  info,
  util,
  checks: {
    captain_check,
    registered_check,
    joined_check,
    in_progress_check,
  },
}) => {
  // add player to active players
  captain_check ()
  registered_check ()
  joined_check ()
  in_progress_check ()
  A.find (x => x.id === player.id) (joined).playing = true
  await send_messages ([
    `You have been marked as present`,
    `Once the set is over, report the match result with ${config.prefix}win, ${config.prefix}loss, or ${config.prefix}draw`,
  ])
  await log_command ()
  dirty = true
}
